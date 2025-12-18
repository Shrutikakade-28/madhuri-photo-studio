import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './styles.css';
import mLogo from './images/m-logo.png';
import heroImage from './wedding/w_8.jpeg';
import service1Image from './babies/b_9.jpeg';
import service2Image from './babies/b_1.jpeg';
import service3Image from './wedding/w_3.jpeg';
import service4Image from './wedding/w_1.jpeg';
import portfolio1Image from './wedding/w_4.jpeg';
import portfolio2Image from './wedding/w_7.jpeg';
import portfolio3Image from './pre_wedding/pw_2.jpeg';
import portfolio4Image from './pre_wedding/pw8.jpeg';
import portfolio5Image from './babies/b_9.jpeg';
import portfolio6Image from './babies/b_11.jpeg';
import portfolio7Img from './babies/b_4.jpeg';
import portfolio8Img from './babies/b_2.jpeg';
import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";
const services = [
  { name: 'Weddings', desc: 'Best photography for your special day', img: service1Image },
  { name: 'Naming Ceremonies', desc: 'Capturing your baby\'s naming ceremony', img: service2Image },
  { name: 'Engagements', desc: 'Beautiful engagement photos', img: service3Image },
  { name: 'Occasional events', desc: 'Memorable moments for refreshing memories', img: service4Image },
];

const portfolioImages = [
  portfolio1Image,
  portfolio2Image,
  portfolio3Image,
  portfolio4Image,
  portfolio5Image,
  portfolio6Image,
  portfolio7Img,
  portfolio8Img
];

const Navbar = ({ openModal }) => (
  <nav className="navbar">
    <div className="navbar-left">
      <img src={mLogo} alt="Logo" className="navbar-logo-img" />
      <div className="navbar-title-group">
        <span className="navbar-title-main">MADHURI</span>
        <span className="navbar-title-sub">Photo Studio</span>
      </div>
    </div>
    <ul className="nav-links">
      <li><a href="#home" className="active">Home</a></li>
      <li><a href="#about">About</a></li>
      <li><a href="#services">Services</a></li>
      <li><a href="#portfolio">Portfolio</a></li>
      <li><a href="#contact">Contact</a></li>
      <li>
        <button className="nav-btn register" onClick={openModal}>Register</button>
      </li>
    </ul>
  </nav>
);

const Hero = ({ openModal }) => (
  <section id="home" className="hero">
    <div className="hero-image">
      <img src={heroImage} alt="Wedding couple" className="hero-img" />
    </div>
    <div className="hero-overlay">
      <div className="hero-content">
        <div className="hero-text">
          <h1>Capturing<br/>Memories,<br/>One Click</h1>
          <h2 className="accent">At a Time</h2>
          <button className="btn book-now" onClick={openModal}>Book Now</button>
        </div>
      </div>
    </div>
  </section>
);

const About = () => (
  <section id="about" className="about">
    <h2> About</h2>
    <h3>Madhuri Photo Studio</h3>
    <p>
      Madhuri Photo Studio is your go-to photography service for capturing life’s most
      important moments. With years of experience and a passion for photography, we
      offer high-quality images and exceptional customer service.
    </p>
  </section>
);

const Services = () => (
  <section id="services" className="services">
    <h2>Services</h2>
    <div className="service-grid">
      {services.map((s, i) => (
        <div className="service-card" key={i}>
          <img
            src={s.img}
            alt={s.name}
            onError={(e) => { e.currentTarget.src = 'https://placehold.co/300x300/CCCCCC/000000?text=Placeholder'; }}
            className="service-img"
          />
          <h3>{s.name}</h3>
          <p>{s.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

const Portfolio = () => (
  <section id="portfolio" className="portfolio">
    <h2>Portfolio</h2>
    <div className="portfolio-grid">
      {portfolioImages.map((img, i) => (
        <div className="port-item" key={i}>
          <img
            src={img}
            alt={`Portfolio ${i + 1}`}
            onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x300/CCCCCC/000000?text=Image+Missing'; }}
          />
        </div>
      ))}
    </div>
  </section>
);

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '',pnone: '', message: '' });
  const [status, setStatus] = useState('');
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('Sending...');
    console.log('Contact Form Submitted:', formData);
    setTimeout(() => {
      setStatus('Message sent successfully! We will contact you soon.');
      setFormData({ name: '', email: '', phone: '', message: '' });
    }, 1500);
  };

  return (
    <section id="contact" className="contact">
      <h2>Contact</h2>
      <form onSubmit={handleSubmit} className="contact-form">
        <input name="name" placeholder="Your name" value={formData.name} onChange={handleChange} required />
        <input name="email" placeholder="Your email" value={formData.email} onChange={handleChange} required />
        <input name="phone" placeholder="Your phone" value={formData.phone} onChange={handleChange} required />
        <textarea name="message" placeholder="Your message" value={formData.message} onChange={handleChange} required />
        <button className="btn" type="submit">Send Message</button>
        {status && <p className={`form-status ${status.includes('successfully') ? 'success' : 'error'}`}>{status}</p>}
      </form>
    </section>
  );
};

const Footer = () => (
  <footer className="footer">
    <p>© {new Date().getFullYear()} Madhuri Photo Studio</p>
  </footer>
);

const LoginModal = ({ isOpen, closeModal }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  if (!isOpen) return null;
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    let response;

    if (isRegister) {
      // REGISTER API
      response = await axios.post(`${API_URL}/register`, {
        name: form.name,
        email: form.email,
        password: form.password
      });
    } else {
      // LOGIN API
      response = await axios.post(`${API_URL}/login`, {
        email: form.email,
        password: form.password
      });
    }

    const data = response.data;
    if (!data.success) {
      alert(data.message);
      return;
    }
    // SAVE USER
    localStorage.setItem("user", JSON.stringify(data.user));
    // Navigate to home
    navigate("/home");
    closeModal();

  } catch (error) {
    console.error("Auth Error:", error);
    alert("Something went wrong. Please try again.");
  }
};

  return (
    <div className="modal-overlay">
      <div className="modal">
        <button className="close-btn" onClick={closeModal}>×</button>
        <h2>{isRegister ? 'Register' : 'Login'}</h2>
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              required
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type="submit" className="btn">{isRegister ? 'Register' : 'Login'}</button>
        </form>
        <p>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button className="switch-btn" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default function Landingpage() {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);
  return (
    <>
      <Navbar openModal={openModal} />
      <main>
        <Hero openModal={openModal} />
        <About />
        <Services />
        <Portfolio />
        <Contact />
      </main>
      <Footer />
      <LoginModal isOpen={modalOpen} closeModal={closeModal} />
    </>
  );
}
