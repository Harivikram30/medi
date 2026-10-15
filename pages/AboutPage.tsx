
import React from 'react';
import { MOCK_DOCTORS } from '../constants';

const AboutPage: React.FC = () => {
  return (
    <div className="bg-white dark:bg-dark-card">
      <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-base font-semibold text-primary tracking-wide uppercase">About Us</h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
            Our Commitment to Your Health
          </p>
          <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500 dark:text-gray-300">
            Learn about our history, our mission, and the dedicated professionals who make MediConnect a pillar of community health.
          </p>
        </div>
      </div>

      {/* History Section */}
      <div className="relative bg-light dark:bg-dark-bg py-16 sm:py-24">
        <div className="lg:mx-auto lg:max-w-7xl lg:px-8 lg:grid lg:grid-cols-2 lg:gap-24 lg:items-start">
          <div className="relative sm:py-16 lg:py-0">
            <div className="relative mx-auto max-w-md px-4 sm:max-w-3xl sm:px-6 lg:px-0 lg:max-w-none lg:py-20">
              <div className="relative pt-64 pb-10 rounded-2xl shadow-xl overflow-hidden">
                <img
                  className="absolute inset-0 h-full w-full object-cover"
                  src="https://placehold.co/600x800/DEE2E6/495057?text=Our+History"
                  alt="Historic hospital building"
                />
              </div>
            </div>
          </div>

          <div className="relative mx-auto max-w-md px-4 sm:max-w-3xl sm:px-6 lg:px-0">
            <div className="pt-12 sm:pt-16 lg:pt-20">
              <h2 className="text-3xl text-gray-900 dark:text-white font-extrabold tracking-tight sm:text-4xl">
                Our History & Mission
              </h2>
              <div className="mt-6 text-gray-500 dark:text-gray-300 space-y-6">
                <p className="text-lg">
                  Founded in 1985, MediConnect started as a small community clinic with a big heart. Our mission has always been simple: to provide accessible, high-quality healthcare with compassion and respect for every individual.
                </p>
                <p className="text-base leading-7">
                  Over the decades, we have grown into a leading medical institution, but our core values remain unchanged. We are dedicated to improving the health and well-being of our community through clinical excellence, continuous innovation, and patient-centered care.
                </p>
                 <p className="text-base leading-7">
                  Our vision is to be the most trusted healthcare partner for life, recognized for our exceptional patient outcomes and a culture of kindness.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Doctors Section */}
      <div className="bg-white dark:bg-dark-card py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-2 lg:max-w-none">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">Meet Our Expert Team</h2>
            <p className="text-xl text-gray-500 dark:text-gray-300">
              Our physicians are among the best in their fields, bringing a wealth of experience and dedication to your care.
            </p>
          </div>
          <ul className="mx-auto mt-20 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4 [perspective:2000px]">
            {MOCK_DOCTORS.map((doctor) => (
              <li key={doctor.id} className="transition-all duration-300 ease-in-out hover:shadow-2xl hover:[transform:rotateX(3deg)_rotateY(-4deg)_translateZ(30px)] rounded-lg p-4">
                <img className="mx-auto h-56 w-56 rounded-full object-cover" src={doctor.imageUrl} alt={doctor.name} />
                <h3 className="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900 dark:text-dark-text">{doctor.name}</h3>
                <p className="text-base leading-7 text-primary">{doctor.specialization}</p>
                <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">{doctor.bio}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
};

export default AboutPage;
