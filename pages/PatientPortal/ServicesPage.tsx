
import React, { useState } from 'react';
import { SERVICES_LIST } from '../../constants';
import type { Page, Service } from '../../types';
import ServiceDetailModal from '../../components/ServiceDetailModal';

interface ServicesPageProps {
  navigate: (page: Page) => void;
}

const ServicesPage: React.FC<ServicesPageProps> = ({ navigate }) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  return (
    <>
      <div className="bg-light dark:bg-dark-bg">
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-base font-semibold text-primary tracking-wide uppercase">Our Services</h2>
            <p className="mt-1 text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
              Comprehensive Medical Care
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500 dark:text-gray-300">
              We offer a full spectrum of specialized medical services to meet all your health needs.
            </p>
          </div>
        </div>

        <div className="pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {SERVICES_LIST.map((service) => (
                <div key={service.name} className="bg-white dark:bg-dark-card rounded-lg shadow-lg p-8 flex flex-col items-center text-center transition-all duration-300 ease-in-out hover:shadow-xl hover:[transform:perspective(1000px)_translateZ(20px)]">
                  <div className="text-6xl mb-6 text-primary">{service.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-dark-text mb-4">{service.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 flex-grow">{service.description}</p>
                  <button
                    onClick={() => setSelectedService(service)}
                    className="mt-6 bg-primary/10 text-primary font-semibold py-2 px-6 rounded-full hover:bg-primary/20 dark:hover:bg-primary/30 transition duration-300"
                  >
                    Learn More
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Emergency Services Highlight */}
        <div className="bg-red-600">
          <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center text-white">
            <h2 className="text-4xl font-extrabold">24/7 Emergency Care</h2>
            <p className="mt-4 text-xl max-w-2xl mx-auto">
              Our Emergency Department is open 24 hours a day, 7 days a week, staffed by board-certified emergency physicians to handle any medical crisis.
            </p>
            <div className="mt-8">
              <a href="tel:123-456-7890" className="inline-block bg-white text-red-600 font-bold py-4 px-10 rounded-full text-lg hover:bg-red-100 transition duration-300">
                Call Emergency: (123) 456-7890
              </a>
            </div>
          </div>
        </div>
      </div>
      {selectedService && (
        <ServiceDetailModal 
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onBookAppointment={() => {
            setSelectedService(null);
            navigate('Contact');
          }}
        />
      )}
    </>
  );
};

export default ServicesPage;
