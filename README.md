# Saffron Monorepo

> Proiect Software Utilitar pentru InfoEducație 2025

---

## Ce este Saffron?

Saffron este o platformă web modernă pentru proiectarea și simularea circuitelor electronice, dezvoltată ca un real instrument educațional și de prototipare rapidă. Aplicația este creată pentru a fi accesibilă, intuitivă și puternică, cu funcționalități avansate de colaborare în timp real și integrare AI.

---

## Funcționalități principale

- **Editor vizual de circuite**: design intuitiv cu drag-and-drop, conectare vizuală între componente.
- **Colaborare în timp real**: utilizatorii pot lucra simultan pe același proiect folosind tehnologia YJS (WebSocket).
- **Integrare AI**: analiza automată și sugestii cu Google Gemini AI.
- **Export SPICE**: compatibilitate cu simulatoare profesionale.
- **Bibliotecă extinsă de componente**: rezistori, condensatori, bobine, diode, tranzistori, AO și multe altele.
- **Recunoaștere automată a circuitelor din imagini** (prin integrarea [Circuit Recognition](https://deepwiki.com/IoanCroitor/circuitrecognition/)).
- **Simulări avansate** (prin integrarea [HTTR](https://deepwiki.com/IoanCroitor/HTTR)).
- **Sistem modern de autentificare și stocare** (Supabase).

---

## Arhitectură și Tehnologii

- **Frontend**: [SvelteKit](https://kit.svelte.dev/), [TailwindCSS](https://tailwindcss.com/), [shadcn-svelte](https://ui.shadcn.com/)
- **Colaborare**: [YJS](https://yjs.dev/) pentru sincronizare dată reală
- **Backend & Auth**: [Supabase](https://supabase.com/) (bază de date relațională, autentificare, storage)
- **AI**: Integrare [Google Gemini](https://deepmind.google/technologies/gemini/)
- **Export**: Generare fișiere SPICE standard
- **Testare**: [Vitest](https://vitest.dev/) (componente și fluxuri)

---

## Instalare și rulare locală

```bash
git clone https://github.com/IoanCroitor/saffron-monorepo.git
cd saffron-monorepo
npm install

# Configurare variabile de mediu
cp .env.example .env
# Editați .env cu datele personale Supabase

# Rularea aplicației în modul dezvoltare
npm run dev

# Pentru build de producție
npm run build
npm run preview
```

---

## Roadmap

- Integrare completă a simulatorului SPICE și a analizelor DC/AC/Tranzientă
- Extindere bibliotecă de componente electronice
- Colaborare asincronă și comentarii pe proiecte
- Integrare cu platforme educaționale externe

---

## Documentație & Resurse

- [Documentație Saffron (DeepWiki)](https://deepwiki.com/IoanCroitor/saffron-monorepo)
- [Documentație Circuit Recognition (DeepWiki)](https://deepwiki.com/IoanCroitor/circuitrecognition/)
- [Documentație HTTR (DeepWiki)](https://deepwiki.com/IoanCroitor/HTTR)


