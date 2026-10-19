# Manual test cases

| Test | Steps | Expected result |
| --- | --- | --- |
| Add contact | Enter a valid name and phone; submit | Contact appears and remains after refresh |
| Invalid contact | Enter a one-letter name or letters in phone | Readable validation error; nothing saved |
| Edit contact | Select edit, change relationship, save | Existing row is updated |
| Delete contact | Select delete and cancel, then repeat and confirm | First attempt remains; confirmed attempt removes it |
| SOS cancel | Press SOS and cancel confirmation | No location request occurs |
| SOS permission allowed | Confirm SOS and allow location | Status becomes ready; coordinates and Maps link appear |
| SOS permission denied | Confirm SOS and deny permission | Friendly location-unavailable message and fallback actions remain |
| SOS sharing | Select a contact and press Open SMS | Composer opens with recipient/message where supported; app does not claim delivery |
| Emergency call | Press Call 112 | Dialer opens where supported; call is not placed silently |
| Nearby service with location | Choose Hospitals and permit location | Google Maps search opens in a new tab near coordinates |
| Nearby service denied | Choose Police and deny location | General Google Maps search opens with an explanatory status |
| Mobile navigation | Use a narrow viewport and open the menu | Drawer opens, links work, overlay closes it |
| Backend unavailable | Stop backend and submit a scan | Frontend shows a readable request error |
| MongoDB unavailable | Start backend without `MONGODB_URI` | Scans work; dashboard says history requires MongoDB |

Test SOS responsibly on a suitable device. Do not test by placing unnecessary calls to emergency services.
