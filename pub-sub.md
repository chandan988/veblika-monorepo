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











Part 1 — Pub/Sub Topic Create Karne Par Kya-Kya Config Karna Hota Hai?

Google Cloud Console → Pub/Sub → Topics → Create Topic

1. Topic Name

Example:

projects/your-project-id/topics/gmail-events

2. Permissions (VERY IMPORTANT)

Gmail ko is topic par message publish karne ki permission deni hoti hai.

Tumhe ye service account ko Publisher role dena पड़ता है:

serviceAccount:gmail-api-push@system.gserviceaccount.com


K steps:

Pub/Sub Topic → Permissions open karo

Add Principal

Principal:

gmail-api-push@system.gserviceaccount.com


Role:

Pub/Sub Publisher


👉 Agar ye permission nahi diya → Gmail tumhare webhook ko kabhi bhi notification nahi bhejega.

✅ Part 2 — Subscription Create Karna (Push)

Topic create karne ke baad:

Pub/Sub → Subscriptions → Create subscription

Configuration:
✔ 1. Subscription Name
gmail-events-sub

✔ 2. Topic

Select the topic:

gmail-events

✔ 3. Delivery Type → PUSH

Ye important hai → Gmail realtime notification ke liye push subscription required hai.

✔ 4. Webhook (Push Endpoint URL)

Yaha tum apna backend webhook URL enter karte ho:

Example:

https://your-backend.com/gmail/webhook


👉 Ye wahi URL hai jahan Gmail notifications push karega.