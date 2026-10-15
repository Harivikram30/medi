import React from 'react';
import type { Page } from '../types';
import { SERVICES_LIST, TESTIMONIALS } from '../constants';

interface HomePageProps {
  navigate: (page: Page) => void;
}

const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  return (
    <div className="animate-fadeIn">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/5 via-light to-primary/5 dark:from-dark-bg dark:via-dark-card/20 dark:to-dark-bg bg-[length:200%_200%] animate-gradientShift text-gray-800 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-primary tracking-tight">
            Compassionate Care, Advanced Medicine
          </h1>
          <p className="mt-6 text-lg md:text-xl max-w-3xl mx-auto text-gray-600 dark:text-gray-300">
            Welcome to MediConnect, where your health is our highest priority. We combine state-of-the-art technology with a human touch to provide you with the best healthcare possible.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button onClick={() => navigate('Services')} className="bg-primary text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 shadow-glow-primary hover:shadow-glow-primary-hover hover:-translate-y-1 w-full sm:w-auto">
              Explore Our Services
            </button>
            <button onClick={() => navigate('Contact')} className="bg-secondary text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 shadow-glow-secondary hover:shadow-glow-secondary-hover hover:-translate-y-1 w-full sm:w-auto">
              Emergency Contact
            </button>
          </div>
        </div>
      </section>

      {/* Services Overview Section */}
      <section className="py-16 bg-white dark:bg-dark-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Our Medical Services</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Providing a wide range of world-class healthcare services.</p>
          </div>
          <div className="mt-12 grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES_LIST.slice(0, 4).map((service) => (
              <div key={service.name} className="bg-light dark:bg-dark-bg p-6 rounded-lg shadow-md text-center transition-all duration-300 ease-in-out hover:shadow-xl hover:[transform:perspective(1000px)_translateZ(20px)]">
                <div className="text-4xl text-primary mb-4">{service.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-dark-text">{service.name}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-light dark:bg-dark-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
              <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Why Choose MediConnect?</h2>
                  <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Our commitment to excellence and patient-centric approach sets us apart.</p>
                  <ul className="mt-8 space-y-6">
                      <li className="flex items-start">
                          <div className="flex-shrink-0"><svg className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></div>
                          <div className="ml-4">
                              <h4 className="text-lg font-semibold text-gray-800 dark:text-dark-text">Expert Medical Team</h4>
                              <p className="text-gray-600 dark:text-gray-400">Our doctors are board-certified leaders in their fields, dedicated to continuous learning and innovation.</p>
                          </div>
                      </li>
                      <li className="flex items-start">
                          <div className="flex-shrink-0"><svg className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></div>
                          <div className="ml-4">
                              <h4 className="text-lg font-semibold text-gray-800 dark:text-dark-text">Advanced Technology</h4>
                              <p className="text-gray-600 dark:text-gray-400">We invest in the latest medical technology to ensure accurate diagnoses and effective treatments.</p>
                          </div>
                      </li>
                      <li className="flex items-start">
                           <div className="flex-shrink-0"><svg className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></div>
                          <div className="ml-4">
                              <h4 className="text-lg font-semibold text-gray-800 dark:text-dark-text">Patient-Centered Care</h4>
                              <p className="text-gray-600 dark:text-gray-400">Your comfort, needs, and privacy are at the heart of everything we do.</p>
                          </div>
                      </li>
                  </ul>
              </div>
              <div className="rounded-lg overflow-hidden shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=2073&auto=format&fit=crop" alt="Bright, modern hospital lobby" className="w-full h-full object-cover"/>
              </div>
          </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white dark:bg-dark-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">What Our Patients Say</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">We are proud of the positive feedback from our community.</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial, index) => (
              <div key={index} className="bg-light dark:bg-dark-bg p-8 rounded-lg shadow-md transition-all duration-300 ease-in-out hover:shadow-xl hover:[transform:perspective(1000px)_translateZ(20px)]">
                <p className="text-gray-600 dark:text-gray-400 italic">"{testimonial.text}"</p>
                <div className="mt-6 flex items-center">
                  <img className="h-12 w-12 rounded-full" src={testimonial.avatar} alt={testimonial.name} />
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900 dark:text-dark-text">{testimonial.name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;