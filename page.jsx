"use client";
import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// --- shared animation ---
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.06 } }),
};

export default function HomePage() {
  // ================= HERO PARALLAX =================
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]); // background drift
  const logoScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const logoOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.6]);

  // ================= ABOUT (editable + optional cloud save) =================
  // Set this to your backend endpoint to enable cloud save later (can stay blank)
  const REMOTE_SAVE_URL = '';

  const [aboutEditing, setAboutEditing] = useState(false);
  const [aboutText, setAboutText] = useState('');
  const [aboutImg, setAboutImg] = useState('');
  const [aboutStatus, setAboutStatus] = useState('');
  const aboutFileRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (REMOTE_SAVE_URL) {
          const res = await fetch(REMOTE_SAVE_URL, { method: 'GET' });
          if (res.ok) {
            const data = await res.json();
            setAboutText(data?.text || '');
            setAboutImg(data?.img || '');
            setAboutStatus('Loaded from server');
            return;
          }
        }
      } catch {}
      // Fallback: local
      try {
        const t = localStorage.getItem('cc_about_text_v1');
        const i = localStorage.getItem('cc_about_img_v1');
        setAboutText(t || "Here you can tell your visitors about yourself, your art, and what inspires you. You can edit this section to include your journey, style, and passion for acrylic pour art. Make it personal and vibrant, like your work.");
        setAboutImg(i || '');
        setAboutStatus('Loaded locally');
      } catch {
        setAboutText("Here you can tell your visitors about yourself, your art, and what inspires you...");
        setAboutImg('');
        setAboutStatus('Using defaults');
      }
    };
    load();
  }, []);

  const persistAboutLocal = (text, img) => {
    try {
      localStorage.setItem('cc_about_text_v1', text);
      localStorage.setItem('cc_about_img_v1', img || '');
    } catch {}
  };

  const saveAbout = async (text = aboutText, img = aboutImg) => {
    persistAboutLocal(text, img); // always keep a local copy
    if (!REMOTE_SAVE_URL) { setAboutStatus('Saved locally'); return; }
    try {
      const res = await fetch(REMOTE_SAVE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, img }) });
      setAboutStatus(res.ok ? 'Saved to server' : 'Server save failed; saved locally');
    } catch {
      setAboutStatus('Offline? Saved locally');
    }
  };

  const onChooseAboutImg = (files) => {
    if (!files || !files[0]) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imgData = String(reader.result);
      setAboutImg(imgData);
      persistAboutLocal(aboutText, imgData);
    };
    reader.readAsDataURL(files[0]);
  };

  // ================= GALLERY (uploads + local save) =================
  const initialGallery = (() => {
    if (typeof window !== 'undefined') {
      try { const saved = localStorage.getItem('cc_gallery_v1'); if (saved) return JSON.parse(saved); } catch {}
    }
    return [];
  })();

  const [gallery, setGallery] = useState(initialGallery); // [{src, title, href}]
  const [editing, setEditing] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const pasteRef = useRef(null);
  const fileInputRef = useRef(null);

  const persistGallery = (items) => {
    setGallery(items);
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('cc_gallery_v1', JSON.stringify(items)); } catch {}
    }
  };

  const filesToDataURLs = async (files) => {
    const readers = Array.from(files).map((file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ src: reader.result, title: file.name.replace(/\.[^.]+$/, ''), href: '' });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }));
    return Promise.all(readers);
  };

  const onFilesChosen = async (files) => {
    if (!files || files.length === 0) return;
    try {
      const additions = await filesToDataURLs(files);
      persistGallery([...(gallery || []), ...additions]);
    } catch (e) {
      console.error('Upload failed', e);
    }
  };

  const addFromUrls = (text) => {
    const urls = text.split(/\n|,|\s/).map((s) => s.trim()).filter(Boolean);
    const additions = urls.map((u, idx) => ({ src: u, title: `Artwork ${(gallery?.length || 0) + idx + 1}`, href: '' }));
    persistGallery([...(gallery || []), ...additions]);
    setShowPaste(false);
  };

  const updateItem = (i, patch) => {
    const next = gallery.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
    persistGallery(next);
  };

  const removeItem = (i) => {
    const next = gallery.filter((_, idx) => idx !== i);
    persistGallery(next);
  };

  const resetGallery = () => persistGallery([]);

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') setShowPaste(false); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  // ================= CONTACT (mailto) =================
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cMsg, setCMsg] = useState('');
  const CONTACT_EMAIL = 'hello@chaoticcolors.art';
  const sendContact = () => {
    const subject = `ChaoticColors Inquiry from ${cName || 'Website Visitor'}`;
    const body = `Name: ${cName}\nEmail: ${cEmail}\n\nMessage:\n${cMsg}`;
    const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ===== NAVBAR ===== */}
      <header className="fixed top-0 inset-x-0 z-40 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between py-3 backdrop-blur supports-[backdrop-filter]:bg-black/30">
            <a href="#hero" className="font-semibold tracking-wide">ChaoticColors</a>
            <nav className="hidden md:flex items-center gap-6 text-sm text-white/80">
              <a href="#about" className="hover:text-white transition">About</a>
              <a href="#gallery" className="hover:text-white transition">Gallery</a>
              <a href="#shop" className="hover:text-white transition">Shop</a>
              <a href="#contact" className="hover:text-white transition">Contact</a>
            </nav>
            <a href="#shop" className="rounded-xl border border-teal-400/60 px-4 py-1.5 text-sm hover:bg-teal-400/10 transition">Browse Prints</a>
          </div>
        </div>
      </header>

      {/* ===== HERO with parallax background ===== */}
      <section id="hero" ref={heroRef} className="relative h-[78vh] md:h-[88vh] overflow-hidden border-b border-white/10 pt-16">
        <motion.div style={{ y }} className="absolute inset-0 bg-cover bg-center">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1920&q=80')" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60" />
        </motion.div>
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <motion.h1 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1, ease: 'easeOut' }} style={{ scale: logoScale, opacity: logoOpacity }} className="text-4xl md:text-6xl font-extrabold tracking-wide text-white drop-shadow-[0_0_28px_#14b8a6]">ChaoticColors</motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }} className="mt-3 text-white/85 tracking-widest">by ChaoticColorDesigns</motion.p>
        </div>
      </section>

      {/* ===== GALLERY (uploads + editing) ===== */}
      <section id="gallery" className="relative py-20 bg-gradient-to-b from-black via-black to-zinc-900">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold text-teal-300 drop-shadow-[0_0_10px_#14b8a6]">Featured Gallery</h2>
              <p className="text-white/60 text-sm mt-1">Upload your art or paste image links. Your changes auto-save locally.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setEditing(v => !v)} className="rounded-xl border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10 transition">{editing ? 'Done' : 'Edit Gallery'}</button>
              <button onClick={() => fileInputRef.current?.click()} className="rounded-xl border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10 transition">Upload Images</button>
              <button onClick={() => setShowPaste(v => !v)} className="rounded-xl border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10 transition">{showPaste ? 'Close Paste Box' : 'Paste URLs'}</button>
              <button onClick={resetGallery} className="rounded-xl border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10 transition">Reset</button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && onFilesChosen(e.target.files)} />
            </div>
          </div>

          {showPaste && (
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/70 mb-2">Paste one or more direct image URLs (each on a new line), then click Add.</p>
              <textarea ref={pasteRef} className="w-full h-28 bg-transparent border border-white/10 rounded-xl p-3 outline-none focus:border-teal-400/60 text-sm" placeholder="https://...jpg\nhttps://...png" />
              <div className="mt-3 flex gap-2">
                <button onClick={() => addFromUrls(pasteRef.current?.value || '')} className="rounded-xl border border-teal-400/50 px-3 py-1.5 text-sm hover:bg-teal-400/10 transition">Add</button>
                <button onClick={() => setShowPaste(false)} className="rounded-xl border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10 transition">Cancel</button>
              </div>
            </div>
          )}

          {gallery.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center"
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
              onDrop={(e) => { e.preventDefault(); const files = e.dataTransfer.files; if (files?.length) onFilesChosen(files); }}
            >
              <p className="text-white/80">Drop images here, click <span className="font-semibold">Upload Images</span>, or use <span className="font-semibold">Paste URLs</span>.</p>
              <p className="text-white/50 text-xs mt-2">Tip: Uploads are converted to base64 so they display reliably and persist locally.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {gallery.map((item, i) => (
                <motion.div key={i} className="group relative overflow-hidden rounded-2xl border border-teal-500/30 bg-gradient-to-b from-black via-zinc-900 to-black transition-all duration-500 hover:shadow-[0_0_20px_#14b8a6]" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} custom={i}>
                  <div className="aspect-[4/3] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.src} alt={item.title || `Artwork ${i + 1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        {editing ? (
                          <div className="grid gap-1">
                            <input value={item.title || ''} onChange={(e) => updateItem(i, { title: e.target.value })} placeholder={`Artwork ${i + 1}`} className="w-full bg-transparent border border-white/15 rounded-lg px-2 py-1 text-xs outline-none focus:border-teal-400/60" />
                            <input value={item.href || ''} onChange={(e) => updateItem(i, { href: e.target.value })} placeholder="Link to product page (optional)" className="w-full bg-transparent border border-white/15 rounded-lg px-2 py-1 text-[11px] outline-none focus:border-teal-400/60" />
                          </div>
                        ) : (
                          <>
                            <p className="text-white/90 font-medium truncate">{item.title || `Acrylic Pour #${i + 1}`}</p>
                            <p className="text-xs text-white/60">Canvas & Phone Case</p>
                          </>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {editing ? (
                          <button onClick={() => removeItem(i)} className="text-xs rounded-xl border border-white/20 px-3 py-1 hover:bg-white/10 transition">Remove</button>
                        ) : (
                          <a href={item.href || '#'} target={item.href ? '_blank' : undefined} rel={item.href ? 'noreferrer' : undefined} className="text-xs rounded-xl border border-teal-400/60 px-3 py-1 hover:bg-teal-400/10 transition">View</a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-t from-teal-500/40 to-transparent transition-all duration-500" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== SHOP (visual preview; no checkout yet) ===== */}
      <section id="shop" className="relative py-20 bg-zinc-900 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 flex items-end justify-between">
            <h3 className="text-2xl md:text-3xl font-semibold text-teal-300 drop-shadow-[0_0_10px_#14b8a6]">Shop</h3>
            <p className="text-sm text-white/60">Preview of your products (checkout coming later)</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map((i) => (
              <motion.div key={i} className="group relative rounded-2xl overflow-hidden border border-teal-500/30 bg-gradient-to-b from-black via-zinc-900 to-black transition-all duration-500 hover:shadow-[0_0_20px_#14b8a6]" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} custom={i}>
                <div className="aspect-[4/3] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://images.unsplash.com/photo-15${i}5905748047-14b19fb3bcd7?auto=format&fit=crop&w=1200&q=80`} alt={`Artwork ${i}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <h4 className="text-white font-medium mb-1 group-hover:text-teal-300 transition">Acrylic Pour #{i}</h4>
                  <p className="text-sm text-white/60 mb-3">From $39 · Gallery-quality print</p>
                  <div className="flex flex-wrap gap-2 text-xs mb-4">
                    {['8×10','12×16','16×20','24×36'].map((sz) => (
                      <button key={sz} className="rounded-md border border-teal-400/40 text-teal-200 px-2 py-1 hover:bg-teal-400/10 transition">{sz}</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 rounded-xl border border-teal-400/60 px-3 py-1.5 text-sm text-teal-300 hover:bg-teal-400/10 transition">Details</button>
                    <button className="flex-1 rounded-xl border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 transition">Buy</button>
                  </div>
                </div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-t from-teal-500/40 to-transparent transition-all duration-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section id="about" className="relative py-24 bg-zinc-950 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 grid md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl md:text-3xl font-semibold text-teal-300 drop-shadow-[0_0_10px_#14b8a6]">About</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setAboutEditing((v) => !v)} className="rounded-xl border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10 transition">{aboutEditing ? 'Done' : 'Edit About'}</button>
                {aboutEditing && (<><button onClick={() => saveAbout()} className="rounded-xl border border-teal-400/60 px-3 py-1.5 text-xs hover:bg-teal-400/10 transition">Save</button><span className="text-[11px] text-white/50">{aboutStatus}</span></>)}
              </div>
            </div>
            {aboutEditing ? (
              <div className="mt-4 grid gap-3">
                <textarea value={aboutText} onChange={(e) => { const v = e.target.value; setAboutText(v); persistAboutLocal(v, aboutImg); }} className="min-h-[160px] bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-teal-400/60" />
                <div className="flex gap-2">
                  <button onClick={() => aboutFileRef.current?.click()} className="rounded-xl border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10 transition">Upload Image</button>
                  <button onClick={() => { setAboutImg(''); persistAboutLocal(aboutText, ''); }} className="rounded-xl border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10 transition">Remove Image</button>
                  <input ref={aboutFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onChooseAboutImg(e.target.files)} />
                </div>
              </div>
            ) : (
              <p className="mt-3 text-white/70 whitespace-pre-line">{aboutText}</p>
            )}
          </div>
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 aspect-[4/3] flex items-center justify-center">
            {aboutImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={aboutImg} alt="About" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white/40 text-sm">(Optional image or portrait can go here)</span>
            )}
          </div>
        </div>
      </section>

      {/* ===== CONTACT (mailto) ===== */}
      <section id="contact" className="relative py-16 bg-black border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-2xl md:text-3xl font-semibold">Get in touch</h3>
            <p className="mt-3 text-white/70">Questions, custom sizes, or wholesale? I’d love to hear from you.</p>
            <p className="mt-4 text-sm text-white/60">Email: <a className="underline decoration-dotted hover:text-teal-300" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
          </div>
          <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); sendContact(); }}>
            <input value={cName} onChange={(e) => setCName(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-teal-400/60" placeholder="Your name" />
            <input value={cEmail} onChange={(e) => setCEmail(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-teal-400/60" placeholder="Your email" />
            <textarea value={cMsg} onChange={(e) => setCMsg(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 h-28 outline-none focus:border-teal-400/60" placeholder="Tell me about your space..." />
            <div className="flex gap-2">
              <button type="submit" className="rounded-xl border border-teal-400/60 px-4 py-2 hover:bg-teal-400/10 transition">Send</button>
              <button type="button" onClick={() => { setCName(''); setCEmail(''); setCMsg(''); }} className="rounded-xl border border-white/20 px-4 py-2 hover:bg-white/10 transition">Clear</button>
            </div>
            <p className="text-xs text-white/50">Note: This opens your email app and addresses it to {CONTACT_EMAIL}. For direct send-from-site later, we can add a backend or a form service.</p>
          </form>
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-white/50 border-t border-white/10">© {new Date().getFullYear()} ChaoticColors by ChaoticColorDesigns</footer>
    </div>
  );
}
