import type { Config } from "tailwindcss";

const config = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: "2rem",
  		screens: {
  			"2xl": "1400px",
  		},
  	},
  	extend: {
  		colors: {
  			// Primary Colors
  			campus: {
  				pink: '#ec4899',    // Pink 500
  				'pink-dark': '#db2777', // Pink 600
  				red: '#ef4444',     // Red 500
  				orange: '#f97316',  // Orange 500
  				'orange-dark': '#ea580c', // Orange 600
  			},
  			// Text Colors
  			text: {
  				primary: '#ffffff',   // White
  				secondary: '#4b5563', // Gray 600
  				muted: '#6b7280',    // Gray 500
  			},
  			// Form Colors
  			form: {
  				border: '#d1d5db',   // Gray 300
  				focus: '#db2777',    // Pink 600
  			},
  			// Action Colors
  			action: {
  				success: '#22c55e',  // Green 500
  				error: '#ef4444',    // Red 500
  			},
  			// Navigation Colors
  			nav: {
  				active: '#db2777',   // Pink 600
  				inactive: '#6b7280', // Gray 500
  			},
  			// Keep existing shadcn colors
  			border: "hsl(var(--border))",
  			input: "hsl(var(--input))",
  			ring: "hsl(var(--ring))",
  			background: "hsl(var(--background))",
  			foreground: "hsl(var(--foreground))",
  			primary: {
  				DEFAULT: "hsl(var(--primary))",
  				foreground: "hsl(var(--primary-foreground))",
  			},
  			secondary: {
  				DEFAULT: "hsl(var(--secondary))",
  				foreground: "hsl(var(--secondary-foreground))",
  			},
  			destructive: {
  				DEFAULT: "hsl(var(--destructive))",
  				foreground: "hsl(var(--destructive-foreground))",
  			},
  			muted: {
  				DEFAULT: "hsl(var(--muted))",
  				foreground: "hsl(var(--muted-foreground))",
  			},
  			accent: {
  				DEFAULT: "hsl(var(--accent))",
  				foreground: "hsl(var(--accent-foreground))",
  			},
  			popover: {
  				DEFAULT: "hsl(var(--popover))",
  				foreground: "hsl(var(--popover-foreground))",
  			},
  			card: {
  				DEFAULT: "hsl(var(--card))",
  				foreground: "hsl(var(--card-foreground))",
  			},
  		},
  		borderRadius: {
  			lg: "var(--radius)",
  			md: "calc(var(--radius) - 2px)",
  			sm: "calc(var(--radius) - 4px)",
  		},
  		backgroundImage: {
  			'gradient-primary': 'linear-gradient(to right bottom, #ec4899, #ef4444, #f97316)',
  			'gradient-primary-hover': 'linear-gradient(to right bottom, #db2777, #dc2626, #ea580c)',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
