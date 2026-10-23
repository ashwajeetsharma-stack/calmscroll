export function ChromeIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" className="opacity-20" />
      <circle cx="12" cy="12" r="4" fill="#4285F4" />
      <path
        d="M12 2C7.5 2 3.7 5.2 2.6 9.5L6.1 15.5C6.1 12.2 8.7 9.5 12 9.5H21.8C20.6 5.1 16.7 2 12 2Z"
        fill="#EA4335"
      />
      <path
        d="M2.6 9.5C2.2 10.3 2 11.1 2 12C2 17.5 6.5 22 12 22L16.8 13.8C15.6 14.5 14.1 15 12.5 15C9.7 15 7.3 13.2 6.5 10.7L2.6 9.5Z"
        fill="#34A853"
      />
      <path
        d="M12 22C16.5 22 20.3 18.8 21.4 14.5H13.6C14.7 13.7 15.4 12.4 15.4 11C15.4 10.5 15.3 10 15.1 9.5L21.4 9.5C21.8 10.3 22 11.1 22 12C22 17.5 17.5 22 12 22Z"
        fill="#FBBC05"
      />
      <circle cx="12" cy="12" r="3" fill="#ffffff" />
      <circle cx="12" cy="12" r="2.2" fill="#4285F4" />
    </svg>
  );
}

export function BraveIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2L4 5.5V11.5C4 16.8 7.4 21.6 12 22.8C16.6 21.6 20 16.8 20 11.5V5.5L12 2Z"
        fill="#FF2000"
        fillOpacity="0.12"
        stroke="#FB542B"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 11.8L11.2 14L15.5 9.5"
        stroke="#FB542B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
