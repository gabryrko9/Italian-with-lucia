"""Build the Czech version of italianwithlucia.com into <site>/cs/.

Usage: python3 build_cs.py <site_dir>
Content fragments live next to this script (cs/*.html); this file holds
the shared chrome (head, header, menu, footer, dock) and the metadata.
"""
import json, os, re, sys, urllib.parse

SITE = sys.argv[1]
SRC = os.path.dirname(os.path.abspath(__file__))
BASE = "https://italianwithlucia.com/"
EMAIL = "lucia.scollo2000@gmail.com"

# en file -> cs file (cs files live in /cs/)
PAGES = {
    "index.html": "index.html",
    "italian-lessons-prague.html": "lekce-italstiny-praha.html",
    "online-italian-lessons.html": "italstina-online.html",
    "italian-group-course.html": "skupinovy-kurz-italstiny.html",
    "italian-for-beginners.html": "italstina-pro-zacatecniky.html",
    "learn-italian.html": "clanky.html",
    "how-long-does-it-take-to-learn-italian.html": "jak-dlouho-trva-naucit-se-italsky.html",
    "passato-prossimo-vs-imperfetto.html": "passato-prossimo-vs-imperfetto.html",
    "italian-phrases-for-travellers.html": "italske-fraze-na-cesty.html",
    "italian-for-companies.html": "italstina-pro-firmy.html",
    "about-lucia.html": "o-lucii.html",
    "privacy.html": "ochrana-osobnich-udaju.html",
}
EN_OF = {v: k for k, v in PAGES.items()}


def en_url(en):
    return BASE if en == "index.html" else BASE + en


def cs_url(cs):
    return BASE + "cs/" if cs == "index.html" else BASE + "cs/" + cs


def cs_href(cs):
    return "./" if cs == "index.html" else cs


def mail(subject, body):
    return ("mailto:" + EMAIL + "?subject=" + urllib.parse.quote(subject)
            + "&amp;body=" + urllib.parse.quote(body, safe=""))


HI = "Dobrý den,\n\n"
BYE = "\n\nDěkuji!"
MAILS = {
    "TRIAL": mail("Zkušební lekce zdarma", HI + "rád/a bych si domluvil/a 30minutovou zkušební lekci zdarma.\n\n"
                  "Moje úroveň: \nMoje cíle: \nOnline, nebo v Praze: \nVyhovující dny a časy: " + BYE),
    "PKG5": mail("Balíček 5 lekcí", HI + "rád/a bych začal/a s balíčkem 5 lekcí.\n\nMoje úroveň: \nOnline, nebo v Praze: " + BYE),
    "PKG10": mail("Balíček 10 lekcí", HI + "rád/a bych začal/a s balíčkem 10 lekcí.\n\nMoje úroveň: \nOnline, nebo v Praze: " + BYE),
    "PKG20": mail("Balíček 20 lekcí", HI + "rád/a bych začal/a s balíčkem 20 lekcí.\n\nMoje úroveň: \nOnline, nebo v Praze: " + BYE),
    "BOOKING": mail("Rezervace lekce", HI + "rád/a bych si zarezervoval/a další lekci.\n\nVyhovující dny a časy: " + BYE),
    "BIZ": mail("Kurz italštiny pro náš tým", HI + "chtěli bychom kurz italštiny pro náš tým.\n\nFirma: \nPočet lidí: \n"
                "Úrovně (začátečníci / středně pokročilí / pokročilí): \nCíl (schůzky, e-maily, cesta, veletrh...): \n"
                "Online, nebo u nás v kanceláři v Praze: \nVyhovující dny a časy: " + BYE),
    "PLAIN": "mailto:" + EMAIL,
}

NAV = [  # (cs file or anchor, short label, menu label)
    ("lekce-italstiny-praha.html", "V Praze", "Lekce italštiny v Praze"),
    ("italstina-online.html", "Online", "Italština online"),
    ("skupinovy-kurz-italstiny.html", "Skupinový kurz", "Skupinový kurz italštiny"),
    ("italstina-pro-firmy.html", "Pro firmy", "Italština pro firmy"),
    ("clanky.html", "Články", "Články o italštině"),
]

FONT = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&amp;display=swap"


def head(cs, meta, ld):
    en = EN_OF[cs]
    url = cs_url(cs)
    robots = meta.get("robots", "index, follow, max-image-preview:large")
    esc = lambda s: s.replace("&", "&amp;").replace('"', "&quot;")
    t, d = esc(meta["title"]), esc(meta["description"])
    pre = '  <link rel="preload" as="image" href="../lucia-cafe.jpg" fetchpriority="high">\n' if cs == "index.html" else ""
    return f"""<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{t}</title>
  <meta name="description" content="{d}">
  <link rel="canonical" href="{url}">
  <link rel="alternate" hreflang="en" href="{en_url(en)}">
  <link rel="alternate" hreflang="cs" href="{url}">
  <link rel="alternate" hreflang="x-default" href="{en_url(en)}">
  <meta name="robots" content="{robots}">
  <meta name="theme-color" content="#0E1240">
  <meta name="geo.region" content="CZ-10">
  <meta name="geo.placename" content="Praha">
  <meta property="og:type" content="{meta.get('og_type', 'website')}">
  <meta property="og:site_name" content="Italian with Lucia">
  <meta property="og:locale" content="cs_CZ">
  <meta property="og:locale:alternate" content="en_GB">
  <meta property="og:title" content="{t}">
  <meta property="og:description" content="{d}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{BASE}og.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{t}">
  <meta name="twitter:description" content="{d}">
  <meta name="twitter:image" content="{BASE}og.jpg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="{FONT}" rel="stylesheet">
{pre}  <link rel="stylesheet" href="../style.css">
  <link rel="icon" href="../favicon.ico" sizes="48x48">
  <link rel="icon" href="../favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="../logo.png">
  <script type="application/ld+json">
{json.dumps(ld, ensure_ascii=False, indent=2)}
</script>
</head>
<body>
"""


def header(cs, skip):
    en = EN_OF[cs]
    en_rel = "../" if en == "index.html" else "../" + en
    nav = "\n".join(f'      <a href="{h}">{s}</a>' for h, s, _ in NAV)
    menu = "\n".join(f'    <a href="{h}">{m}</a>' for h, _, m in NAV)
    return f"""<a class="skip" href="{skip[0]}">{skip[1]}</a>
<header class="bar">
  <div class="wrap bar-in">
    <a class="mark" href="./" aria-label="Italian with Lucia, úvodní stránka">
      <svg class="mark-icon" viewBox="0 0 32 32" aria-hidden="true"><path d="M5 4h22a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H15l-7 6v-6H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" fill="currentColor"/></svg>
      Italian with Lucia
    </a>
    <nav class="bar-nav" aria-label="Hlavní menu">
{nav}
      <a href="./#faq">Otázky</a>
      <a class="portal-link" href="../portal.html" data-portal hidden>Moje lekce</a>
    </nav>
    <a class="lang" href="{en_rel}" hreflang="en" lang="en" aria-label="English version">EN</a>
    <a class="btn btn-lemon btn-sm bar-cta" data-trial href="{MAILS['TRIAL']}">Lekce zdarma</a>
    <button class="menu-btn" id="menu-btn" type="button" aria-expanded="false" aria-controls="menu" aria-label="Otevřít menu"><span></span><span></span><span></span></button>
  </div>
</header>

<div class="menu" id="menu" hidden>
  <nav class="wrap menu-in" aria-label="Menu webu">
    <a href="./">Úvod</a>
    <a href="./#lessons">Individuální lekce a ceny</a>
{menu}
    <a href="italstina-pro-zacatecniky.html">Italština pro začátečníky</a>
    <a href="o-lucii.html">O Lucii</a>
    <a href="./#faq">Otázky</a>
    <a class="portal-link" href="../portal.html" data-portal hidden>Moje lekce (studentská sekce)</a>
    <a href="{en_rel}" hreflang="en" lang="en">English version</a>
  </nav>
  <div class="wrap menu-cta"><a class="btn btn-lemon btn-lg" data-trial href="{MAILS['TRIAL']}">Napsat Lucii o lekci zdarma</a></div>
</div>
"""


def footer(dock):
    return f"""<footer class="foot">
  <div class="wrap foot-in">
    <p class="foot-brand">Italian with Lucia</p>
    <p>Lekce italštiny v Praze a online. Působnost: Praha 1, 2 a 3 a online po celém světě.</p>
    <ul class="foot-nav" aria-label="Další stránky">
      <li><a href="./#lessons">Individuální lekce a ceny</a></li>
      <li><a href="lekce-italstiny-praha.html">Lekce italštiny v Praze</a></li>
      <li><a href="italstina-online.html">Italština online</a></li>
      <li><a href="skupinovy-kurz-italstiny.html">Skupinový kurz italštiny</a></li>
      <li><a href="italstina-pro-firmy.html">Italština pro firmy</a></li>
      <li><a href="italstina-pro-zacatecniky.html">Italština pro začátečníky</a></li>
      <li><a href="clanky.html">Články o italštině</a></li>
      <li><a href="o-lucii.html">O Lucii</a></li>
      <li><a href="./#faq">Otázky</a></li>
    </ul>
    <p><a href="{MAILS['PLAIN']}">{EMAIL}</a></p>
    <p><a href="https://www.linkedin.com/in/lucia-scollo/" target="_blank" rel="me noopener">LinkedIn</a></p>
    <p>Lekci lze zrušit nejpozději 24 hodin před začátkem.</p>
    <p data-portal hidden>Už k Lucii chodíte? <a href="../portal.html">Zobrazit moje lekce</a></p>
    <p class="foot-fine">© 2026 Italian with Lucia, Praha · <a href="ochrana-osobnich-udaju.html">Ochrana osobních údajů</a></p>
  </div>
</footer>

<div class="dock" id="dock">
{dock}
</div>

<script src="../config.js"></script>
<script src="../script.js"></script>
</body>
</html>
"""


FINAL = """<section class="s s-cobalt final" id="book">
  <div class="wrap final-in">
    <h2>První lekce je zdarma.</h2>
    <p>Třicet minut s Lucií, online nebo v Praze. Pošlete krátký e-mail a ona odpoví do 24 hodin, abyste si domluvili termín.</p>
    <a class="btn btn-lemon btn-lg" data-trial href="{{TRIAL}}">Napsat Lucii o lekci zdarma</a>
    <p class="final-alt">Nemáte v zařízení e-mailovou aplikaci? <button type="button" class="linkbtn" id="copy-mail" data-email="lucia.scollo2000@gmail.com">Zkopírujte adresu</button> nebo <a href="https://mail.google.com/mail/?view=cm&amp;fs=1&amp;to=lucia.scollo2000@gmail.com&amp;su=Zku%C5%A1ebn%C3%AD%20lekce%20zdarma" target="_blank" rel="noopener">napište přes Gmail</a>.</p>
    <p class="final-mail">lucia.scollo2000@gmail.com</p>
    <span class="sr-only" id="copy-status" role="status"></span>
  </div>
</section>"""

DOCK_TRIAL =f'  <a class="btn btn-lemon" data-trial href="{MAILS["TRIAL"]}">Lekce zdarma</a>\n  <a class="btn btn-line" href="./#lessons">Ceny</a>'
DOCK_BIZ = f'  <a class="btn btn-lemon" href="{MAILS["BIZ"]}">Požádat o nabídku</a>\n  <a class="btn btn-line" href="#prices">Ceny</a>'
DOCK_GROUP = f'  <a class="btn btn-lemon" data-group href="#reserve">Přihlásit se</a>\n  <a class="btn btn-line" href="#levels">Úrovně</a>'

BIZ = {"@type": "EducationalOrganization", "@id": BASE + "#business", "name": "Italian with Lucia", "url": BASE}


def crumbs(cs, items):
    lst = [{"@type": "ListItem", "position": 1, "name": "Italian with Lucia", "item": cs_url("index.html")}]
    for i, (name, f) in enumerate(items, 2):
        lst.append({"@type": "ListItem", "position": i, "name": name, "item": cs_url(f)})
    return {"@type": "BreadcrumbList", "itemListElement": lst}


def faq_ld(main):
    strip = lambda s: re.sub(r"<[^>]+>", "", s).strip()
    qa = re.findall(r"<summary>(.*?)</summary>\s*<p>(.*?)</p>", main, re.S)
    if not qa:
        return []
    return [{"@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": strip(q), "acceptedAnswer": {"@type": "Answer", "text": strip(a)}} for q, a in qa]}]


def article(cs, meta):
    return {"@type": "Article", "headline": meta["h1"], "description": meta["description"],
            "inLanguage": "cs", "image": BASE + "og.jpg", "datePublished": "2026-10-15", "dateModified": "2026-10-15",
            "mainEntityOfPage": cs_url(cs), "author": {"@type": "Person", "name": "Lucia", "jobTitle": "Lektorka italštiny"},
            "publisher": {"@id": BASE + "#business"}}


def service(cs, name, meta):
    return {"@type": "Service", "name": name, "description": meta["description"], "provider": {"@id": BASE + "#business"},
            "url": cs_url(cs), "areaServed": [{"@type": "City", "name": "Praha"}], "serviceType": "Výuka italštiny",
            "inLanguage": "cs"}


COURSE = {
    "@type": "Course", "@id": cs_url("skupinovy-kurz-italstiny.html") + "#course",
    "name": "Skupinový kurz italštiny pro začátečníky (A1–A2)",
    "description": "Skupinový kurz italštiny online pro začátečníky: 12 týdenních živých lekcí přes video ve skupině 3 až 5 studentů, 18 € za lekci.",
    "url": cs_url("skupinovy-kurz-italstiny.html"), "provider": BIZ, "inLanguage": "it", "teaches": "Italština",
    "educationalLevel": "Začátečníci (A1–A2)", "image": BASE + "og.jpg",
    "offers": {"@type": "Offer", "price": "216", "priceCurrency": "EUR", "category": "Paid", "url": cs_url("skupinovy-kurz-italstiny.html")},
    "hasCourseInstance": {"@type": "CourseInstance", "courseMode": "Online", "startDate": "2027-01",
                          "courseSchedule": {"@type": "Schedule", "repeatFrequency": "P1W", "repeatCount": 12, "duration": "PT1H"},
                          "instructor": {"@type": "Person", "name": "Lucia", "url": cs_url("o-lucii.html")}},
}

META = {
    "index.html": dict(
        title="Italian with Lucia: lekce italštiny v Praze a online",
        description="Naučte se italsky s Lucií: individuální lekce a skupinové kurzy online nebo osobně v Praze. Postgraduální Master v didaktice italštiny, přes 2 000 hodin výuky a 150 studentů. Lekce zdarma.",
        skip=("#lessons", "Přejít na lekce"), dock=DOCK_TRIAL),
    "lekce-italstiny-praha.html": dict(
        title="Lekce italštiny v Praze | Soukromá lektorka, lekce zdarma",
        description="Lekce italštiny v Praze s Lucií, kvalifikovanou lektorkou z Itálie. Individuálně v Praze 1, 2 a 3 nebo online. Začněte 30minutovou lekcí zdarma.",
        crumb="Lekce italštiny v Praze", service="Individuální lekce italštiny v Praze"),
    "italstina-online.html": dict(
        title="Italština online | Živé lekce s lektorkou z Itálie",
        description="Lekce italštiny online s Lucií, kvalifikovanou lektorkou. Živé individuální lekce přes video, všechny úrovně. 30 minut zdarma, balíčky od 25 € za lekci.",
        crumb="Italština online", service="Individuální lekce italštiny online"),
    "skupinovy-kurz-italstiny.html": dict(
        title="Skupinový kurz italštiny pro začátečníky online | Od ledna",
        description="Online kurz italštiny pro začátečníky v malé skupině: 12 týdenních živých lekcí přes video s Lucií, 3–5 lidí. 18 € za lekci, platíte až po potvrzení skupiny.",
        crumb="Skupinový kurz italštiny", dock=DOCK_GROUP, course=True),
    "italstina-pro-zacatecniky.html": dict(
        title="Italština pro začátečníky | Od nuly s lektorkou",
        description="Naučte se italsky od nuly s kvalifikovanou lektorkou. První fráze, výslovnost a jasný plán pro úplné začátečníky. Online nebo v Praze. Lekce zdarma.",
        crumb="Italština pro začátečníky", service="Italština pro začátečníky"),
    "clanky.html": dict(
        title="Články o italštině: tipy a návody zdarma | Italian with Lucia",
        description="Články o italštině od kvalifikované lektorky: jak dlouho trvá naučit se italsky, passato prossimo vs imperfetto a nejdůležitější fráze na cesty s výslovností.",
        crumb="Články o italštině", collection=True),
    "jak-dlouho-trva-naucit-se-italsky.html": dict(
        title="Jak dlouho trvá naučit se italsky? Realistický plán",
        h1="Jak dlouho trvá naučit se italsky?",
        description="Jak dlouho trvá naučit se italsky? Realistický odhad pro každou úroveň (A1 až C1), co zvládnete v každé fázi a jednoduchý týdenní plán.",
        crumb="Jak dlouho trvá naučit se italsky", parent=True, og_type="article"),
    "passato-prossimo-vs-imperfetto.html": dict(
        title="Passato prossimo vs imperfetto: kdy použít který čas",
        h1="Passato prossimo vs imperfetto",
        description="Passato prossimo a imperfetto jednoduše a česky: kdy použít který čas, jak je tvořit, příklady a krátké cvičení s řešením.",
        crumb="Passato prossimo vs imperfetto", parent=True, og_type="article"),
    "italske-fraze-na-cesty.html": dict(
        title="Italské fráze na cesty (s výslovností)",
        h1="Nejdůležitější italské fráze na cesty",
        description="Italské fráze na cesty a do běžného života s jednoduchou výslovností: pozdravy, kavárna, restaurace, cesta a nákupy. A 5 pravidel výslovnosti.",
        crumb="Italské fráze na cesty", parent=True, og_type="article"),
    "italstina-pro-firmy.html": dict(
        title="Italština pro firmy v Praze | Kurzy pro týmy",
        description="Kurzy italštiny pro firmy a týmy v Praze: individuálně nebo v malých skupinách, online nebo u vás v kanceláři, zaměřené na schůzky, e-maily a pracovní cesty. Od 35 € za lekci.",
        crumb="Italština pro firmy", service="Kurzy italštiny pro firmy", dock=DOCK_BIZ),
    "o-lucii.html": dict(
        title="O Lucii | Italian with Lucia, lektorka italštiny v Praze",
        description="Seznamte se s Lucií: postgraduální Master v didaktice italštiny, přes 2 000 hodin výuky a 150 studentů, lekce v Praze a online. Mluví trochu česky a učí i studenty, kteří mluví jen česky.",
        crumb="O Lucii", about=True),
    "ochrana-osobnich-udaju.html": dict(
        title="Ochrana osobních údajů | Italian with Lucia",
        description="Jak Italian with Lucia nakládá s vašimi osobními údaji: co se ukládá, proč a jak požádat o přístup nebo výmaz.",
        crumb="Ochrana osobních údajů", robots="noindex, follow"),
}


def build(cs):
    meta = META[cs]
    main = open(os.path.join(SRC, cs)).read().replace("{{FINAL}}", FINAL)
    for k, v in MAILS.items():
        main = main.replace("{{" + k + "}}", v)
    if "{{REVIEWS}}" in main:
        en = open(os.path.join(SITE, "index.html")).read()
        main = main.replace("{{REVIEWS}}", re.search(r'  <div class="reel">.*?\n  </div>\n</section>', en, re.S).group(0)[:-len("\n</section>")])
    graph = []
    if cs == "index.html":
        graph.append({"@type": ["ProfessionalService", "EducationalOrganization"], "@id": BASE + "#business",
                      "name": "Italian with Lucia", "url": BASE,
                      "description": "Individuální lekce italštiny a skupinové kurzy online i osobně v Praze 1, 2 a 3.",
                      "knowsLanguage": ["it", "en", "cs"], "areaServed": [{"@type": "City", "name": "Praha"}, {"@type": "Place", "name": "Online"}]})
        graph.append(dict(COURSE, description="Dvanáct týdenních živých lekcí italštiny online pro začátečníky, ve skupině 3 až 5 studentů."))
    else:
        items = []
        if meta.get("parent"):
            items.append(("Články o italštině", "clanky.html"))
        items.append((meta["crumb"], cs))
        graph.append(crumbs(cs, items))
    if meta.get("service"):
        graph.append(service(cs, meta["service"], meta))
    if meta.get("course"):
        graph.append(COURSE)
    if meta.get("og_type") == "article":
        graph.append(article(cs, meta))
    if meta.get("collection"):
        graph.append({"@type": "CollectionPage", "name": "Články o italštině", "description": meta["description"],
                      "url": cs_url(cs), "inLanguage": "cs", "isPartOf": {"@id": BASE + "#business"}})
    if meta.get("about"):
        graph.append({"@type": "AboutPage", "name": meta["title"], "url": cs_url(cs), "inLanguage": "cs", "mainEntity": {"@id": BASE + "#lucia"}})
        graph.append({"@type": "Person", "@id": BASE + "#lucia", "name": "Lucia", "jobTitle": "Lektorka italštiny",
                      "image": BASE + "lucia-portrait.jpg", "url": cs_url(cs), "sameAs": ["https://www.linkedin.com/in/lucia-scollo/"],
                      "alumniOf": {"@type": "CollegeOrUniversity", "name": "Università per Stranieri di Perugia"},
                      "knowsLanguage": ["it", "en", "cs"], "worksFor": {"@id": BASE + "#business"},
                      "workLocation": {"@type": "City", "name": "Praha"}})
    graph += faq_ld(main)
    ld = {"@context": "https://schema.org", "@graph": graph}
    skip = meta.get("skip", ("#content", "Přeskočit na obsah"))
    html = head(cs, meta, ld) + header(cs, skip) + "\n" + main.rstrip("\n") + "\n\n" + footer(meta.get("dock", DOCK_TRIAL))
    os.makedirs(os.path.join(SITE, "cs"), exist_ok=True)
    open(os.path.join(SITE, "cs", cs), "w").write(html)


if __name__ == "__main__":
    for cs in META:
        build(cs)
    print("built", len(META), "Czech pages")
