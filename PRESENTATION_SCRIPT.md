# Two-minute presentation script

Good morning. Our project is **SurakshaSathi AI — Smart Scam Detection and Emergency Safety Assistant**, with the tagline **Spot Scams. Share Safety. Get Help.**

The problem we address is that scam messages create urgency and confusion, while people in emergencies may find it difficult to communicate their location quickly. Our solution combines simple scam education and emergency actions in a responsive web application.

First, I will demonstrate the message checker. I paste this sample bank message and press Analyze. The React frontend sends the text to our Express API. The backend rule-based analyzer checks distinct patterns such as OTP requests, urgency, impersonation, payment requests, and suspicious links. It returns a score, category, individual explanations, and recommended actions. The full message is not stored. Only a summary is saved in MongoDB.

Next is the URL checker. It uses JavaScript URL parsing to check structural warnings such as HTTP, IP-address hosts, shortened links, punycode, the @ symbol, and misleading domain patterns. It never opens the submitted link. Importantly, this is a transparent rule-based prototype—not a trained machine-learning model.

The SOS page first asks for confirmation and browser location permission. It creates one Google Maps link and an emergency message. The user must choose Share, SMS, Copy, or Call. The application never silently sends a message or places a call.

Emergency contacts are stored in browser Local Storage for a simple no-login demonstration. Nearby services open Google Maps searches without a paid API key. The safety-tips page teaches practical prevention.

Our stack is React, Tailwind CSS, Vite, Node.js, Express, MongoDB, and Mongoose. Automated tests verify both analyzers. Future work could add multilingual support and a properly trained Python machine-learning model. Thank you.

## Easy application flow

`User input → React form → fetch API → Express route → analyzer → optional MongoDB summary → JSON response → result card`
