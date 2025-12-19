import React, { useState } from 'react';
import './Home.css';
import mLogo from './images/m-logo.png';
import weddingImg from './wedding/w_7.jpeg';
import preWeddingImg from './pre_wedding/pw8.jpeg';
import weddingPackageImg from './wedding/w_2.jpeg';
import engagementImg from './wedding/w_3.jpeg';
import babyImg from './babies/b_9.jpeg';
import birthdayImg from './babies/b_11.jpeg';
import specialEventImg from './wedding/w_1.jpeg';
import babyImg2 from './babies/b_1.jpeg';

const bookings = [
  { title: 'Wedding', img: weddingImg },
  { title: 'Pre-Wedding', img: preWeddingImg },
  { title: 'Baby', img: babyImg2 },
  { title: 'Whole Wedding Package', img: weddingPackageImg },
  { title: 'Engagement', img: engagementImg },
  { title: 'Baby Naming Ceremony', img: babyImg },
  { title: 'Birthday', img: birthdayImg },
  { title: 'Your Special Event', img: specialEventImg }
];
const uniqueBookings = Array.from(new Map(bookings.map((b) => [b.title, b])).values());

export default function Home() {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (err) {
    console.error("Invalid user JSON");
  }
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const openModal = (booking) => setSelectedBooking(booking);
  const closeModal = () => setSelectedBooking(null);

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    setShowTerms(true);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    alert('Thanks — your message was sent. We will contact you soon.');
    e.target.reset();
  };
  
const openTestPayment = async () => {
  const name = document.querySelector('input[name="name"]').value;
  const email = document.querySelector('input[name="email"]').value;
  const phone = document.querySelector('input[name="phone"]').value;

  // create order + booking on backend so we have a bookingId to confirm later
  const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');
  const createRes = await fetch(`${API_BASE}/api/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      email,
      phone,
      eventType: selectedBooking.title,
      amount: 7000 // send amount in INR (server multiplies by 100)
    }),
  });

  const createData = await createRes.json();
  if (!createData || !createData.success) {
    console.error('Create order failed', createData);
    alert('❌ Could not create order. Please try again later.');
    return;
  }

  const order = createData.order;
  const bookingId = createData.bookingId;
  const key = createData.key || process.env.REACT_APP_RAZORPAY_KEY_ID;

  if (!window.Razorpay) {
    alert('Razorpay SDK not loaded. Please check your network or include the SDK script.');
    return;
  }

  const options = {
    key: key,
    amount: order.amount,
    currency: order.currency || 'INR',
    name: "Madhuri Photo Studio",
    description: `Booking for ${selectedBooking.title}`,
    order_id: order.id,
    handler: async function (response) {
      alert("✅ Payment Successful! Payment ID: " + response.razorpay_payment_id);

      // confirm payment for booking on backend
      const API_BASE2 = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');
      await fetch(`${API_BASE2}/api/payment-success`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, paymentId: response.razorpay_payment_id }),
      });

      setShowTerms(false);
      setSelectedBooking(null);
    },
    prefill: { name, email, contact: phone },
    theme: { color: "#ff9c11" },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};
  return (
    <div className="home-wrapper">
      <div className="bubbles">
        {Array.from({ length: 30 }).map((_, i) => (
          <span key={i} className="bubble"></span>
        ))}
      </div>
      <nav className="navbar">
        <div className="navbar-left">
          <img src={mLogo} alt="Logo" className="navbar-logo-img" />
          <div className="navbar-title-group">
            <span className="navbar-title-main">MADHURI</span>
            <span className="navbar-title-sub">Photo Studio</span>
          </div>
        </div>
        <ul className="nav-links">
          <li><a href="#book">Book Event</a></li>
          <li><a href="#services">Services</a></li>
          <li><a href="#aboutus">About Us</a></li>
          <li><a href="#contact">Contact</a></li>
          <div className="profile">
            <img src={mLogo} alt="Profile" className="profile-img" />
            <button className="logout-btn" onClick={handleLogout}>
                Logout
            </button>
          </div>
        </ul>
      </nav>
      <main className="home-main">
        <h2>Welcome to Madhuri Photo Studio</h2>
        <p>Capture your special moments, and Let them be your best Memories, Book your photography session now for any event, any occasion!!</p>
        <div className="services-section">
          <div className="booking-grid">
            {uniqueBookings.map((booking, idx) => (
              <div className="booking-card" key={booking.title || idx}>
                <img src={booking.img} alt={booking.title} />
                <div className="booking-caption">{booking.title}</div>
                <button
                  type="button"
                  className="booking-btn"
                  onClick={() => openModal(booking)}
                >
                  Book Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
      {selectedBooking && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="modal-close" role="button" aria-label="Close booking modal" onClick={closeModal}>&times;</span>
            <h2>{selectedBooking.title}</h2>
            <div className="modal-images">
              <img src={selectedBooking.img} alt="sample" />
            </div>
            <p className="modal-summary">
              Capture unforgettable moments with professional photography,
              premium editing & full event coverage.
            </p>
            <div className="modal-info">
              <p><strong>Duration:</strong> whole wedding</p>
              <p><strong>Price:</strong> ₹7,000 – ₹20,000</p>
            </div>
                <form className="modal-form" onSubmit={handleBookingSubmit}>
                  <input name="name" type="text" placeholder="Your Name" required />
                  <input name="email" type="email" placeholder="Email Address" required />
                  <input name="venue address" type="tel" placeholder="venue address" required />
                  <input name="phone" type="tel" placeholder="Phone Number" required />
                  <button className="modal-book-btn" type="submit">Book Event</button>
                </form>
            {showTerms && (
  <div className="modal-overlay" onClick={() => setShowTerms(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="modal-close" role="button" aria-label="Close terms modal" onClick={() => setShowTerms(false)}>&times;</span>

      <h2>📜 Terms & Conditions</h2>

      <ul className="terms-list">
        <li>✅ Make sure your details are real and correct.</li>
        <li>💰 You need to make <strong>50% advance payment</strong> before / while booking.</li>
        <li>
          📞 If you are not sure, you can contact the owner:
          <br />
          <strong>Phone:</strong> +91 9970072306  
          <br />
          <strong>Email:</strong> Madhuriphoto24@gmail.com
        </li>
      </ul>
      <button className="modal-book-btn" onClick={openTestPayment}>
         Proceed to Payment
      </button>
    </div>
  </div>
)}
          </div>
        </div>
      )}
      {/* About Section */}
      <section id="aboutus" className="about-section">
        <h2>About Us</h2>
        <p>
          Madhuri Photo Studio has been capturing beautiful memories for over 12 years.
          We specialize in wedding photography, pre-wedding shoots, baby shoots,
          cinematic videography, and full-event coverage.
          Our mission is to create timeless memories with creativity and passion.
        </p>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <h2>Contact Us</h2>

        <div className="contact-details">
          <p><strong>📍 Address:</strong> MADHURI PHOTO STUDIO savalaj...
                NEAR VAINGANGA BANK...
                A/P - SAVLAJ
                TAL-TASGAON
                DIST-SANGLI
                416311
            </p>
          <p><strong>📞 Phone:</strong> +91 9970072306</p>
          <p><strong>📧 Email:</strong> Madhuriphoto24@gmail.com</p>
        </div>

        <form className="contact-form" onSubmit={handleContactSubmit}>
          <input name="name" type="text" placeholder="Your Name" required />
          <input name="email" type="email" placeholder="Your Email" required />
          <textarea name="message" placeholder="Your Message" required />
          <button type="submit" className="contact-btn">Send Message</button>
        </form>
      </section>
    </div>
  );
}
