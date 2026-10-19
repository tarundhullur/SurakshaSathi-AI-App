# SurakshaSathi AI viva guide

1. **What problem does SurakshaSathi AI solve?**  
   It explains common scam warning signs and helps users prepare basic emergency actions from one web application.

2. **Why did we choose React?**  
   React makes interactive screens easier to divide into reusable components and update with state.

3. **What is Tailwind CSS?**  
   It is a utility-first CSS framework. We combine small classes directly in JSX to build responsive designs.

4. **Why do we need Node.js and Express?**  
   Node runs JavaScript on the server. Express provides simple routes that receive requests and return JSON.

5. **What is an API?**  
   An API is a defined way for software parts to communicate. Our frontend sends HTTP requests to backend endpoints.

6. **How does React communicate with Express?**  
   `src/services/api.js` uses `fetch` to send JSON. Express reads it with `express.json()` and returns JSON.

7. **What is MongoDB?**  
   MongoDB is a document database that stores JSON-like BSON documents in collections.

8. **Why use Mongoose?**  
   Mongoose provides a schema, validation, and easy model methods for MongoDB.

9. **Why is scan history stored in MongoDB?**  
   It demonstrates persistent backend storage and allows recent scan summaries to appear on the dashboard.

10. **Do we save the complete message or URL?**  
    No. We save only type, score, category, indicator names, and timestamps to reduce privacy risk.

11. **Why use Local Storage for contacts?**  
    It is simple, works without login, and is suitable for a prototype. It is not encrypted secure storage.

12. **How does the scam detector calculate risk?**  
    Each distinct matched rule adds a fixed weight once. The sum is capped at 100 and mapped to low, medium, or high risk.

13. **Why is the same word not counted repeatedly?**  
    We filter the rule list, so each rule contributes at most once. Repeating “OTP” does not repeatedly add 30 points.

14. **Is this real machine learning or AI?**  
    No. It is an explainable rule-based risk analyzer. “AI” is part of the project identity, not a claim that this version contains a trained model.

15. **How could Python add real machine learning later?**  
    We could collect consented labeled examples, clean the data, train and evaluate an NLP classifier in Python, expose it through an API, and monitor bias and accuracy.

16. **What is phishing?**  
    Phishing is an attempt to trick users into revealing data, opening malware, or making payments by impersonating a trusted source.

17. **Does HTTPS guarantee that a website is safe?**  
    No. HTTPS encrypts the connection but a scammer can also obtain an HTTPS certificate.

18. **Why use JavaScript's `URL` class?**  
    It reliably separates protocol, hostname, path, and other parts before we apply understandable checks.

19. **What happens with a malformed URL?**  
    URL parsing fails, so we return a clear invalid-structure indicator without opening the address.

20. **How does browser geolocation work?**  
    The browser asks the user for permission, then the device provides coordinates when available.

21. **What happens when location permission is denied?**  
    The status becomes unavailable and fallback SMS, copy, and call actions remain available.

22. **How does the SOS workflow work?**  
    Confirm, request one location, build text and a Maps link, then let the user choose a sharing action.

23. **Why are emergency messages not sent automatically?**  
    User confirmation prevents accidental or abusive actions, and browsers restrict silent SMS and calls for safety.

24. **Does opening SMS or Share prove delivery?**  
    No. It only opens an interface. The user must complete sending, and delivery is not guaranteed.

25. **Does the app provide live location tracking?**  
    No. It shares one current coordinate link for this beginner prototype.

26. **How are nearby services found?**  
    We build a Google Maps search URL for the chosen category and coordinates. No paid Maps API is required.

27. **What if MongoDB is unavailable?**  
    Analysis still works, but history returns an informative 503 error and the dashboard explains configuration is needed.

28. **What is CORS?**  
    Cross-Origin Resource Sharing is a browser security mechanism. The backend allows the configured frontend origin.

29. **What are React `useState` and `useEffect` used for?**  
    `useState` stores UI data such as input and results. `useEffect` loads dashboard history after the component appears.

30. **What are the main limitations?**  
    Rules can miss new scams, URL checks do not inspect live sites, device APIs vary, and browser SOS cannot guarantee response.

31. **How did we test the project?**  
    Node's test runner checks ten analyzer cases. We also have manual browser tests for contacts, permissions, links, and confirmations.

32. **How would we improve it?**  
    Add multilingual support, optional reputation sources, stronger deployment security, encrypted accounts, PWA offline support, and a carefully evaluated ML model.
