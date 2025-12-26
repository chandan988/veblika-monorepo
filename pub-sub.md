Step-by-step setup (Hindi + short)
1️⃣ Gmail API + Pub/Sub API enable karo

Google Cloud Console → APIs & Services → Library →
✔ Gmail API
✔ Cloud Pub/Sub API

2️⃣ Pub/Sub Topic banao

Pub/Sub → Topics → Create topic

naam: gmail-notify-topic

result:

projects/YOUR_PROJECT_ID/topics/gmail-notify-topic

3️⃣ Aapke endpoint ke liye Push Subscription banao

Pub/Sub → Subscriptions → Create Subscription

Topic: gmail-notify-topic

Delivery Type: Push

Endpoint URL: https://yourapp.com/api/email-notify (example)

🚨 Important:
Endpoint HTTPS + valid SSL hona chahiye, warna Pub/Sub push nahi karega.