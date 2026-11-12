#!/usr/bin/env python3
"""Reads the original ZIP folder tree (read-only) and produces:
   site/assets/img/**   optimised WebP derivatives (thumb + full), originals untouched
   site/assets/data/portfolio.js   section -> client -> category -> images map
Every manifest item keeps `src`, the original relative path, as a reference."""
import os, re, json, hashlib, shutil, subprocess
from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = None
SRC = '/home/claude/src'
OUT = '/home/claude/portfolio'
IMG = f'{OUT}/assets/img'
cache = {}  # md5 -> manifest item (duplicates processed once)

def nat(s):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r'(\d+)', s)]

def listing(rel, exts=('.jpg', '.jpeg', '.png')):
    d = os.path.join(SRC, rel)
    return [os.path.join(rel, f) for f in sorted(os.listdir(d), key=nat)
            if f.lower().endswith(exts) and os.path.isfile(os.path.join(d, f))]

def to_rgb_or_rgba(im):
    im = ImageOps.exif_transpose(im)
    if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
        return im.convert('RGBA')
    return im.convert('RGB')

def save(im, path, long_edge, q):
    im = im.copy()
    im.thumbnail((long_edge, long_edge), Image.LANCZOS)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, 'WEBP', quality=q, method=6)
    return im.size

def process(rel, outdir, name, alt, thumb=900, full=2200, logo=False):
    p = os.path.join(SRC, rel)
    h = hashlib.md5(open(p, 'rb').read()).hexdigest()
    if h in cache:
        item = dict(cache[h]); item['alt'] = alt; return item
    im = to_rgb_or_rgba(Image.open(p))
    if logo:
        w, hh = save(im, f'{IMG}/{outdir}/{name}.webp', 700, 90)
        item = dict(thumb=f'assets/img/{outdir}/{name}.webp', full=f'assets/img/{outdir}/{name}.webp', w=w, h=hh)
    else:
        tw, th = save(im, f'{IMG}/{outdir}/{name}-s.webp', thumb, 78)
        save(im, f'{IMG}/{outdir}/{name}.webp', full, 84)
        item = dict(thumb=f'assets/img/{outdir}/{name}-s.webp', full=f'assets/img/{outdir}/{name}.webp', w=tw, h=th)
    item['src'] = rel
    item['alt'] = alt
    cache[h] = item
    return item

def gallery(rel, outdir, label, **kw):
    items = []
    for i, f in enumerate(listing(rel), 1):
        items.append(process(f, outdir, f'{i:02d}', f'{label} {i}', **kw))
    return items

def logo_of(rel, outdir, name, alt):
    return process(rel, outdir, name, alt, logo=True)

D = {}
# ---------------------------------------------------------------- 01 Home & About
home = '01 - Home Page & About Images'
D['home'] = {
    'cutout': process(f'{home}/Cinematic Young Man Portrait Cutout.png', 'home', 'portrait-cutout', 'Portrait of Rahmat Sharify', thumb=1100, full=1100),
    'about': process(f'{home}/Personal_Photo.jpg', 'home', 'about-walking', 'Rahmat Sharify walking through a narrow lane', thumb=1000, full=1400),
    'profile': process(f'{home}/Profile_Photo.jpg', 'home', 'profile', 'Profile photo of Rahmat Sharify', thumb=900, full=1000),
}
os.makedirs(f'{IMG}/brand', exist_ok=True)
shutil.copy(f'{SRC}/{home}/withrahmat LOGO .svg', f'{IMG}/brand/withrahmat-logo.svg')
shutil.copy(f'{SRC}/06 - Cooperation Logos/TOEFL Academy .svg', f'{IMG}/brand/toefl-academy.svg')

# ---------------------------------------------------------------- 02 CV
os.makedirs(f'{OUT}/assets/docs', exist_ok=True)
shutil.copy(f'{SRC}/02 - CV/CV - Rahmat Sharify   .pdf', f'{OUT}/assets/docs/Rahmat-Sharify-CV.pdf')
shutil.copy(f'{SRC}/03 - Graphic Design Section/Designed Logos.pdf', f'{OUT}/assets/docs/Designed-Logos.pdf')

# ---------------------------------------------------------------- 03 Graphic Design
gd = '03 - Graphic Design Section'
# Designed Logos.pdf is a one-page A4 sheet: render it so it can be shown in the gallery
tmp = '/home/claude/_logos_pdf'
subprocess.run(['pdftoppm', '-r', '220', '-png', f'{SRC}/{gd}/Designed Logos.pdf', tmp], check=True)
lp = Image.open(tmp + '-1.png').convert('RGB')
w, h = save(lp, f'{IMG}/graphic-design/logo-designs/01.webp', 2400, 86)
save(lp, f'{IMG}/graphic-design/logo-designs/01-s.webp', 1100, 80)
logo_sheet = dict(thumb='assets/img/graphic-design/logo-designs/01-s.webp', full='assets/img/graphic-design/logo-designs/01.webp',
                  w=1100, h=round(1100 * h / w), alt='Logo designs sheet', src=f'{gd}/Designed Logos.pdf')

D['graphic'] = [
    dict(id='artworks', title='Artworks & Calligraphy', folder='Artworks and calligraphy',
         items=gallery(f'{gd}/Artworks and calligraphy', 'graphic-design/artworks', 'Calligraphy artwork')),
    dict(id='social', title='Social Designs', folder='Social Designs',
         items=gallery(f'{gd}/Social Designs', 'graphic-design/social', 'Social design')),
    dict(id='flyers', title='Flyers & Brochures', folder='Flyers & Brochures',
         items=gallery(f'{gd}/Flyers & Brochures', 'graphic-design/flyers', 'Flyer or brochure')),
    dict(id='packaging', title='Packaging & Labels', folder='Package and Labels',
         items=gallery(f'{gd}/Package and Labels', 'graphic-design/packaging', 'Packaging or label design')),
    dict(id='cards', title='Business Cards', folder='Business Cards',
         items=gallery(f'{gd}/Business Cards', 'graphic-design/cards', 'Business card design')),
    dict(id='certificates', title='Certificates', folder='Certficates',
         items=gallery(f'{gd}/Certficates', 'graphic-design/certificates', 'Certificate design')),
    dict(id='logos', title='Logo Designs', folder='Designed Logos.pdf', items=[logo_sheet]),
]

# ---------------------------------------------------------------- 04 Recent Clients
rc = '04 - Recent Clients Section'
ab = f'{rc}/Abasalih FC'
abg = f'{ab}/01 - Graphic Desgin'
def sub(name, label):
    return dict(title=name, items=gallery(f'{abg}/{name}', f'clients/abasalih-fc/graphic/{re.sub("[^a-z]+","-",name.lower()).strip("-")}', label))
loose = []
for i, f in enumerate(listing(abg), 1):
    loose.append(process(f, 'clients/abasalih-fc/graphic/other', f'{i:02d}', f'Abasalih FC design {i}'))
clients = [
    dict(id='abasalih-fc', name='Abasalih FC', folder='Abasalih FC',
         logo=logo_of(f'{ab}/abasalih Futsal Club - Logo .png', 'clients/abasalih-fc', 'logo', 'Abasalih FC logo'),
         categories=[
             dict(id='graphic', title='Graphic Design', groups=[
                 sub('Matchday Posters'.replace('Matchday', 'MatchDay'), 'Abasalih FC matchday poster'),
                 sub('New Signings', 'Abasalih FC new signing'),
                 sub('Starting Lineup', 'Abasalih FC starting lineup'),
                 sub('Game Results', 'Abasalih FC game result'),
                 sub('Best Player', 'Abasalih FC best player'),
                 dict(title='Group Standings & National Team Call-up', items=loose),
             ]),
             dict(id='photography', title='Photography', groups=[
                 dict(title=None, items=gallery(f'{ab}/02 - Photography', 'clients/abasalih-fc/photography', 'Abasalih FC photograph'))]),
         ]),
    dict(id='afpl', name='AFPL', folder='AFPL',
         logo=logo_of(f'{rc}/AFPL/AFPL copy.png', 'clients/afpl', 'logo', 'AFPL logo'),
         categories=[dict(id='photography', title='Photography', groups=[
             dict(title=None, items=gallery(f'{rc}/AFPL/Photography Samples', 'clients/afpl/photography', 'AFPL photograph'))])]),
    dict(id='bahami-jaghori-fc', name='Bahami Jaghori FC', folder='Bahami Jaghori FC',
         logo=logo_of(f'{rc}/Bahami Jaghori FC/Bahami Jaghori FC LOGO.png', 'clients/bahami-jaghori-fc', 'logo', 'Bahami Jaghori FC logo'),
         categories=[
             dict(id='graphic', title='Graphic Design', groups=[
                 dict(title=None, items=gallery(f'{rc}/Bahami Jaghori FC/Graphic Design', 'clients/bahami-jaghori-fc/graphic', 'Bahami Jaghori FC poster'))]),
             dict(id='photography', title='Photography', groups=[
                 dict(title=None, items=gallery(f'{rc}/Bahami Jaghori FC/Photos', 'clients/bahami-jaghori-fc/photography', 'Bahami Jaghori FC photograph'))]),
         ]),
    dict(id='futsal-afghanistan', name='Futsal Afghanistan', folder='Futsal Afghanistan',
         logo=logo_of(f'{rc}/Futsal Afghanistan/Afghanistan Football Federation Logo .png', 'clients/futsal-afghanistan', 'logo', 'Afghanistan Football Federation logo'),
         categories=[dict(id='graphic', title='Graphic Design', groups=[
             dict(title=None, items=gallery(f'{rc}/Futsal Afghanistan/Designs', 'clients/futsal-afghanistan/graphic', 'Futsal Afghanistan design'))])]),
    dict(id='halima-beauty', name='Halima Beauty', folder='Halima Beauty',
         logo=logo_of(f'{rc}/Halima Beauty/Halima Beauty Logo .png', 'clients/halima-beauty', 'logo', 'Halima Beauty logo'),
         categories=[dict(id='graphic', title='Graphic Design', groups=[
             dict(title=None, items=gallery(f'{rc}/Halima Beauty/Graphic Design', 'clients/halima-beauty/graphic', 'Halima Beauty design'))])]),
    dict(id='setaragan-lal', name='Setaragan Lal', folder='Setaragan Lal',
         logo=logo_of(f'{rc}/Setaragan Lal/Setaragan Lal Logo .png', 'clients/setaragan-lal', 'logo', 'Setaragan Lal logo'),
         categories=[dict(id='graphic', title='Graphic Design', groups=[
             dict(title=None, items=gallery(f'{rc}/Setaragan Lal/Designs', 'clients/setaragan-lal/graphic', 'Setaragan Lal design'))])]),
]
D['clients'] = clients

# ---------------------------------------------------------------- 05 Photography
ph = '05 - Photography Section'
D['photography'] = [
    dict(id='places', title='Places & Landscapes', folder='Photography', items=gallery(f'{ph}/Photography', 'photography/places', 'Photograph')),
    dict(id='sports', title='Sports', folder='Sports', items=gallery(f'{ph}/Sports', 'photography/sports', 'Sports photograph', thumb=1100)),
    dict(id='events-1', title='Events: Futsal Tournament', folder='Events/Event-Photography-1', items=gallery(f'{ph}/Events/Event-Photography-1', 'photography/events-1', 'Event photograph')),
    dict(id='events-2', title='Events: Stage & Ceremonies', folder='Events/Event-Photography-2', items=gallery(f'{ph}/Events/Event-Photography-2', 'photography/events-2', 'Event photograph')),
]

# ---------------------------------------------------------------- 06 Cooperation logos
cl = '06 - Cooperation Logos'
coops = []
for f in sorted(os.listdir(f'{SRC}/{cl}'), key=nat):
    base = os.path.splitext(f)[0].strip()
    base = re.sub(r'\s+copy$', '', base, flags=re.I).strip()
    label = {'Akbari': 'Akbari Printing Press', 'abasalih Futsal Club': 'Abasalih Futsal Club',
             'Attack Energy - Green Camp': 'Attack Energy', 'Kabotaran Haram': 'Kabotaran Haram'}.get(base, base)
    slug = re.sub(r'[^a-z0-9]+', '-', base.lower()).strip('-')
    if f.lower().endswith('.svg'):
        coops.append(dict(name=label, thumb='assets/img/brand/toefl-academy.svg', w=1008, h=1008, alt=f'{label} logo', src=f'{cl}/{f}'))
    else:
        it = logo_of(f'{cl}/{f}', 'cooperation', slug, f'{label} logo')
        it = dict(it); it['name'] = label
        coops.append(it)
D['cooperations'] = coops

os.makedirs(f'{OUT}/assets/data', exist_ok=True)
with open(f'{OUT}/assets/data/portfolio.js', 'w') as fh:
    fh.write('window.PORTFOLIO = ' + json.dumps(D, ensure_ascii=False, indent=1) + ';\n')

n = sum(1 for _ in cache)
print('unique processed images:', n)
os.system(f'du -sh {OUT}/assets/img')
