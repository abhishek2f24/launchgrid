import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact LaunchGrid',
  description: 'How to reach LaunchGrid: support email, grievance officer and business contact details.',
  alternates: { canonical: 'https://launchgrid.in/legal/contact' },
};

export default function ContactPage() {
  return (
    <>
      <h1>Contact Us</h1>
      
      <p>If you have any questions, disputes, or wish to report a violation of our terms, please contact us using the details below.</p>
      
      <h3>Business Details</h3>
      <p>LaunchGrid is operated by <strong>Abhishek Maurya</strong> (sole proprietor), Vadodara, Gujarat, India.</p>

      <h3>Contact Channels</h3>
      <ul>
        <li><strong>Support Email:</strong> support@launchgrid.in</li>
        <li><strong>Abuse/Takedown Notices:</strong> abuse@launchgrid.in</li>
        <li><strong>Phone / WhatsApp:</strong> <a href="tel:+919506212886">+91 95062 12886</a> (Mon-Fri, 10 AM - 6 PM IST)</li>
      </ul>
      
      <h3>Grievance Officer</h3>
      <p>In compliance with the Information Technology Act, 2000, our Grievance Officer can be reached at grievance@launchgrid.in.</p>
    </>
  );
}
