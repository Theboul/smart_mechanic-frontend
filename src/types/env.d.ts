export {};

declare global {
  interface Window {
    __env?: {
      apiUrl?: string;
      aiReportUrl?: string;
      firebase?: {
        apiKey?: string;
        authDomain?: string;
        projectId?: string;
        storageBucket?: string;
        messagingSenderId?: string;
        appId?: string;
      };
      vapidKey?: string;
      googleMapsApiKey?: string;
    };
  }
}
