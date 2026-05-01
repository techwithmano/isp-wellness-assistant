**GitHub Description:**  
A customized wellness and health tracking application built for the ISP institution, featuring GenAI assessments, Firebase integration, and Clerk Auth.

---

# 🌿 ISP Wellness Assistant

## 📖 Overview
The ISP Wellness Assistant is a specialized health and wellness tracking platform custom-built for the ISP (Institution). Sharing the robust architectural backbone of ManoMed AI, this application has been specifically tailored to meet the needs of the ISP school environment. It empowers students and staff to track their well-being, take AI-driven health assessments, and access wellness resources securely. By integrating institutional needs with modern AI diagnostics, it promotes a healthier, more proactive school community.

## ✨ Key Features
* **Tailored AI Assessments:** Customized Google GenAI logic adapted specifically for the student and staff demographics of ISP.
* **Secure Authentication:** Enterprise-grade secure login and user management via Clerk.
* **Real-time Data Syncing:** Firebase integration with TanStack Query for seamless, real-time data storage and retrieval.
* **Automated Notifications:** Built-in email alerts and notifications powered by Resend and SendGrid.
* **Wellness Dashboards:** Personalized health tracking dashboards featuring Recharts for data visualization.
* **PDF Exporting:** Ability to generate and download health assessment reports using jsPDF.

## 💻 Tech Stack
* **Frontend:** Next.js 15, React 18, TypeScript
* **Authentication:** Clerk (@clerk/nextjs)
* **Backend & Database:** Firebase (Firestore), TanStack Query
* **Artificial Intelligence:** Google GenAI, Genkit
* **Styling & Components:** Tailwind CSS, Radix UI, Recharts
* **Email Services:** Resend, SendGrid

## 🚀 Getting Started

Follow these steps to set up and run the ISP Wellness Assistant locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/techwithmano/isp-wellness-assistant.git
   cd isp-wellness-assistant
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file with your specific API keys:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   GOOGLE_GENAI_API_KEY=your_google_genai_api_key
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   # Add other required Firebase config keys
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:9003` (or the port indicated in your terminal) to view the application.

