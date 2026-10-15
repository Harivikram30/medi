
import React, { useState } from 'react';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.fullName || !formData.email || !formData.message) {
      setFormError('Please fill in your name, email, and message.');
      setStatus('error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    setStatus('sending');
    
    try {
        const response = await fetch('https://formsubmit.co/monika200619@gmail.com', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                name: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                message: formData.message,
            })
        });

        if (response.ok) {
            setStatus('success');
            setFormData({ fullName: '', email: '', phone: '', message: '' });
            // Reset status after a few seconds so the user can send another message
            setTimeout(() => setStatus('idle'), 5000);
        } else {
            const data = await response.json().catch(() => ({})); // Handle cases where response is not JSON
            console.error("FormSubmit Error:", data);
            setFormError(data.message || 'An error occurred. Please try again.');
            setStatus('error');
        }
    } catch (error) {
        console.error('Submission error:', error);
        setFormError('There was a network error sending your message. Please check your connection and try again.');
        setStatus('error');
    }
  };

  return (
    <div className="bg-white dark:bg-dark-bg">
       <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-base font-semibold text-primary tracking-wide uppercase">Contact Us</h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
            Get In Touch
          </p>
          <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500 dark:text-gray-300">
            We're here to help. Reach out to us for appointments, inquiries, or support.
          </p>
        </div>
      </div>

      <div className="relative bg-light dark:bg-dark-bg">
        <div className="absolute inset-0">
          <div className="absolute inset-y-0 left-0 w-1/2 bg-gray-50 dark:bg-dark-bg" />
        </div>
        <div className="relative max-w-7xl mx-auto lg:grid lg:grid-cols-5">
          <div className="bg-gray-50 dark:bg-dark-bg py-16 px-4 sm:px-6 lg:col-span-2 lg:px-8 lg:py-24 xl:pr-12">
            <div className="max-w-lg mx-auto">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl">Contact Information</h2>
              <p className="mt-3 text-lg leading-6 text-gray-500 dark:text-gray-300">
                Our team is ready to assist you. For medical emergencies, please call 911 or our emergency line immediately.
              </p>
              <dl className="mt-8 text-base text-gray-500 dark:text-gray-400">
                <div>
                  <dt className="sr-only">Postal address</dt>
                  <dd>
                    <p>123 Health St</p>
                    <p>Medcity, MC 12345</p>
                  </dd>
                </div>
                <div className="mt-6">
                  <dt className="sr-only">Phone number</dt>
                  <dd className="flex">
                    <svg className="flex-shrink-0 h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="ml-3">(123) 456-7890</span>
                  </dd>
                </div>
                 <div className="mt-3">
                  <dt className="sr-only">Emergency Phone</dt>
                  <dd className="flex">
                    <svg className="flex-shrink-0 h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM5.05 4.05a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM14.95 4.05a1 1 0 00-1.414-1.414l-.707.707a1 1 0 101.414 1.414l.707-.707zM10 5a5 5 0 100 10 5 5 0 000-10zm0 12a1 1 0 100-2 1 1 0 000 2zM3 10a1 1 0 11-2 0 1 1 0 012 0zm14 0a1 1 0 11-2 0 1 1 0 012 0zM6.464 14.95a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM13.536 14.95a1 1 0 00-1.414-1.414l-.707-.707a1 1 0 101.414 1.414l.707.707z" clipRule="evenodd" /></svg>
                    <span className="ml-3 font-semibold">(123) 456-7890 <span className="text-red-500">(Emergency)</span></span>
                  </dd>
                </div>
                <div className="mt-3">
                  <dt className="sr-only">Email</dt>
                  <dd className="flex">
                    <svg className="flex-shrink-0 h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="ml-3">contact@mediconnect.hms</span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-card py-16 px-4 sm:px-6 lg:col-span-3 lg:py-24 lg:px-8 xl:pl-12">
            <div className="max-w-lg mx-auto lg:max-w-none">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-y-6">
                <div>
                  <label htmlFor="full-name" className="sr-only">Full name</label>
                  <input type="text" name="fullName" id="full-name" autoComplete="name" value={formData.fullName} onChange={handleChange} className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-primary focus:border-primary border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Full name" />
                </div>
                <div>
                  <label htmlFor="email" className="sr-only">Email</label>
                  <input id="email" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleChange} className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-primary focus:border-primary border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Email" />
                </div>
                <div>
                  <label htmlFor="phone" className="sr-only">Phone</label>
                  <input type="text" name="phone" id="phone" autoComplete="tel" value={formData.phone} onChange={handleChange} className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-primary focus:border-primary border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Phone (Optional)" />
                </div>
                <div>
                  <label htmlFor="message" className="sr-only">Message</label>
                  <textarea id="message" name="message" rows={4} value={formData.message} onChange={handleChange} className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-primary focus:border-primary border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Message"></textarea>
                </div>
                <div>
                  <button type="submit" disabled={status === 'sending'} className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {status === 'sending' ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
                {status === 'success' && (
                  <div className="rounded-md bg-green-50 dark:bg-green-900/50 p-4 animate-fadeIn">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">Message sent successfully!</p>
                        <p className="mt-1 text-sm text-green-700 dark:text-green-400">Thank you for reaching out. We will get back to you shortly.</p>
                      </div>
                    </div>
                  </div>
                )}
                 {status === 'error' && formError && (
                  <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4 animate-fadeIn">
                     <div className="flex">
                       <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                       </div>
                       <div className="ml-3">
                         <p className="text-sm font-medium text-red-800 dark:text-red-300">{formError}</p>
                       </div>
                     </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
