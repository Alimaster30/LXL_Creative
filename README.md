# LxL Creative — Digital Agency & Production Studio

A modern, high-performance creative agency website featuring cinematic interactions, smooth scrolling, GSAP-powered motion graphics, and Barba.js page transitions.

---

## 🌟 Overview

**LxL Creative** is an entertainment marketing agency and production studio specializing in Key Art, Social Campaigns, Unit Photography, EPK, Activations, and Editorial for top global entertainment brands.

---

## 📄 Pages

| Page | File | Route | Description |
| :--- | :--- | :--- | :--- |
| **Home** | [`index.html`](index.html) | `/` | Showcase reel, interactive highlights, client marquee, and service previews. |
| **About** | [`about.html`](about.html) | `/about` | Agency story, leadership, creative vision, and studio ethos. |
| **Services** | [`services.html`](services.html) | `/services` | Capabilities breakdown including Key Art, Social, Unit, EPK, and Activations. |
| **Work** | [`work.html`](work.html) | `/work` | Interactive portfolio grid with tag filtering and project spotlights. |
| **LXL Studios** | [`lxl-studios.html`](lxl-studios.html) | `/lxl-studios` | Dedicated showcase for the studio production arm. |
| **Contact** | [`contact.html`](contact.html) | `/contact` | Inquiry form and contact coordinates. |

---

## 🛠️ Tech Stack & Libraries

* **Motion & Animations:** [GSAP 3](https://greensock.com/gsap/) (ScrollTrigger, Flip, Draggable, InertiaPlugin, SplitText, CustomEase, ScrollToPlugin, DrawSVGPlugin)
* **Smooth Scrolling:** [Lenis](https://github.com/darkroomengineering/lenis)
* **Page Transitions:** [Barba.js](https://barba.js.org/) for seamless asynchronous page transitions
* **Interactive Filtering:** Finsweet Attributes & jQuery
* **Video Playback:** HLS.js streaming support
* **Styling:** Custom responsive CSS architecture

---

## 📁 Project Structure

```text
├── .gitignore            # Excludes browser cache, profiles, and OS files
├── .htaccess             # Apache/LiteSpeed rewrite rules for clean URLs & redirects
├── index.html            # Homepage
├── about.html            # About page
├── services.html         # Services overview
├── work.html             # Portfolio grid
├── contact.html          # Contact page
├── lxl-studios.html      # LXL Studios page
├── css/
│   ├── odyn-bundle.css   # Main component styles
│   ├── style.css         # Global themes & layout
│   └── webflow-shared.css# Core layout framework
├── js/
│   ├── main.js           # Core interaction logic
│   ├── odyn-bundle.js    # Bundled interactions & Barba setup
│   ├── barba.js          # Barba transition engine
│   ├── gsap.js           # GreenSock animation platform
│   ├── lenis.js          # Smooth scroll implementation
│   └── ...               # Additional helper & plugin scripts
└── README.md
```

---

## 🚀 Deployment (Hostinger)

This repository is optimized for deployment on **Hostinger** (Apache / LiteSpeed):

1. **Clean URLs via `.htaccess`:**
   The site uses extensionless URLs (e.g., `/about`, `/services`) to work seamlessly with Barba.js. The included [`.htaccess`](.htaccess) file automatically routes extensionless requests to `.html` files and gracefully handles missing CMS subroutes.

2. **Deploying via Hostinger Git:**
   - In your Hostinger control panel (hPanel), go to **Advanced > Git**.
   - Paste repository URL: `https://github.com/Alimaster30/LXL_Creative.git`
   - Set branch to `main`.
   - Set target directory to `/public_html` (or your subdomain folder).
   - Click **Create & Deploy**.

---

## 👤 Author

* **GitHub:** [@Alimaster30](https://github.com/Alimaster30)
