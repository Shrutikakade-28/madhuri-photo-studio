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
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
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

const EVENT_DETAILS = {
  'Wedding': { duration: 'Full day (8–10 hrs)', price: '₹7,000 – ₹25,000' },
  'Whole Wedding Package': { duration: 'Full day / Multiple sessions', price: '₹12,000 – ₹40,000' },
  'Pre-Wedding': { duration: '2–4 hrs', price: '₹4,000 – ₹10,000' },
  'Engagement': { duration: '2–3 hrs', price: '₹3,000 – ₹8,000' },
  'Baby': { duration: '1–2 hrs', price: '₹2,000 – ₹7,000' },
  'Baby Naming Ceremony': { duration: '2–3 hrs', price: '₹3,000 – ₹8,000' },
  'Birthday': { duration: '2–3 hrs', price: '₹3,000 – ₹10,000' },
  'Your Special Event': { duration: 'Varies', price: 'Contact for quote' },
  'Special Event': { duration: 'Varies', price: 'Contact for quote' },
  'Other': { duration: 'Varies', price: 'Contact for quote' }
};

const getEventDetails = (title) => {
  return EVENT_DETAILS[title] || { duration: 'Varies', price: 'Contact for quote' };
};

export default function Home() {
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const openModal = (booking) => setSelectedBooking({ ...booking, ...getEventDetails(booking.title) });
  const closeModal = () => setSelectedBooking(null);

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    setShowTerms(true);
  };
  const handleContactSubmit = async (e) => {
    e.preventDefault();

    const form = e.target;
    const name = form.name.value;
    const email = form.email.value;
    const message = form.message.value;

    const API_BASE =
      process.env.REACT_APP_API_URL ||
      (process.env.NODE_ENV === "development" ? "http://localhost:5000" : "");

    try {
      const res = await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();

      if (data.success) {
        alert("✅ Message sent successfully!");
        form.reset();
      } else {
        alert("❌ Failed to send message. Try again.");
      }
    } catch (err) {
      console.error("Contact message error:", err);
      alert("❌ Network error. Please try again later.");
    }
  };
  const openTestPayment = async () => {
    if (!selectedBooking) {
      alert('Please select an event to book.');
      return;
    }

    try {
      const name = document.querySelector('input[name="name"]').value;
      const email = document.querySelector('input[name="email"]').value;
      const phone = document.querySelector('input[name="phone"]').value;
      const location = document.querySelector('input[name="location"]').value || null;

      const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');
      const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
      const createRes = await fetch(`${API_BASE}/api/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || null,
          name,
          email,
          phone,
          eventType: selectedBooking.title,
          amount: 7000, // send amount in INR (server multiplies by 100)
          location
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
    } catch (err) {
      console.error('Payment flow failed:', err);
      alert('Network or server error occurred. Please try again later.');
    }
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

        {/* Hamburger for small screens */}
        <button
          className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((s) => !s)}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        <ul className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <li className="nav-item">
            <span onClick={() => {
              setShowBookDropdown(!showBookDropdown);
              setShowServiceDropdown(false);
              setMobileMenuOpen(false);
            }}>
              Book Event
            </span>

            {showBookDropdown && (
              <ul className="dropdown">
                {[
                  "Marriage",
                  "Engagement",
                  "Pre-Wedding",
                  "Baby Ceremony",
                  "Special Event",
                  "Others"
                ].map((event) => {
                  const EVENT_MAP = {
                    'Marriage': { title: 'Wedding', img: weddingImg },
                    'Engagement': { title: 'Engagement', img: engagementImg },
                    'Pre-Wedding': { title: 'Pre-Wedding', img: preWeddingImg },
                    'Baby Ceremony': { title: 'Baby', img: babyImg },
                    'Special Event': { title: 'Special Event', img: specialEventImg },
                    'Others': { title: 'Other', img: specialEventImg },
                  };
                  const ev = EVENT_MAP[event] || { title: event, img: specialEventImg };
                  return (
                    <li
                      key={event}
                      onClick={() => {
                        openModal(ev);
                        setShowBookDropdown(false);
                      }}
                    >
                      {event}
                    </li>
                  );
                })}
              </ul>
            )}
          </li>

          <li className="nav-item">
            <span onClick={() => {
              setShowServiceDropdown(!showServiceDropdown);
              setShowBookDropdown(false);
            }}>
              Services
            </span>

            {showServiceDropdown && (
              <ul className="dropdown">
                {["Photography", "Videography", "Other"].map((service) => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
            )}
          </li>
          <li>
            <a href="/booked-events">Booked Events</a>
          </li>
          <li>
            <a href="#aboutus">About Us</a>
          </li>
          <li>
            <a href="#contact">Contact</a>
          </li>
        </ul>
        <div className="profile">
          <a href="/profile">
            <img
              src={user?.profile_image || mLogo} // dynamically show uploaded image
              alt={user?.name || "Profile"}
              className="profile-img"
            />
          </a>
        </div>

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
              <p><strong>Duration:</strong> {selectedBooking.duration || 'Varies'}</p>
              <p><strong>Price:</strong> {selectedBooking.price || 'Contact for quote'}</p>
            </div>
            <form className="modal-form" onSubmit={handleBookingSubmit}>
              <input name="name" type="text" placeholder="Your Name" required />
              <input name="email" type="email" placeholder="Email Address" required />
              <input name="location" type="text" placeholder="Venue address" required />
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

        <footer className="main-footer">
          <div className="footer-content">
            {/* Footer Info */}
            <div className="footer-info">
              <div className="footer-left">
                <img src={mLogo} alt="Logo" className="navbar-logo-img" />
                <div className="footer-title-group">
                  <span className="navbar-title-main">MADHURI</span>
                  <span className="footer-title-sub">Photo Studio</span>
                </div>
              </div>
              <p className="footer-description">
                Capturing your precious moments with creativity and passion. We specialize in weddings, pre-weddings, baby shoots, and special events.
              </p>
            </div>

            {/* Footer Links */}
            <div className="footer-links">
              <div className="footer-column">
                <h4>Services</h4>
                <ul>
                  <li><a href="#services-section">Photography</a></li>
                  <li><a href="#services-section">Videography</a></li>
                  <li><a href="#aboutus">Full Event Coverage</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Support</h4>
                <ul>
                  <li><a href="#contact">Contact Us</a></li>
                  <li><a href="#aboutus">About Us</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Follow Us</h4>
                <ul className="social-links">
                  <li><a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a></li>
                  <li><a href="https://www.instagram.com/madhuri_photo_savlaj?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                  <li><a href="http://www.youtube.com/@madhuriphotosavlaj5638" target="_blank" rel="noopener noreferrer">YouTube</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="footer-bottom">
            <p>&copy; 2026 Madhuri Photo Studio. All rights reserved.</p>
          </div>
        </footer>
      </section>
    </div>
  );
}
