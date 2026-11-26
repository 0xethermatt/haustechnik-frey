"""Zeichnet das Firmenlogo (Images/Logo/Logo.png, Vorlage der Fahrzeugbeschriftung) als Vektorgrafik nach.
Aufruf: python3 scripts/logo/trace_logo.py   (benötigt: pip install potracer numpy scipy pillow)
Ergebnis: public/logo-mark.svg. Das Logo der Website ist KEIN Nachbau von Hand, sondern wird aus dieser Datei erzeugt."""
import numpy as np, potrace
from PIL import Image

import os, sys
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC=os.path.join(ROOT, 'Images', 'Logo', 'Logo.png')
S=4  # Auflösung beim Nachzeichnen (glattere Kanten)
im=Image.open(SRC).convert('RGB')
from PIL import ImageFilter
big=im.resize((im.size[0]*S, im.size[1]*S), Image.LANCZOS).filter(ImageFilter.GaussianBlur(3))
a=np.asarray(big).astype(int)

# Palette der Original-Datei (Mittelwerte der reinen Flächen)
orig=np.asarray(im).astype(int)
def center(approx, tol=28):
    d=np.abs(orig-np.array(approx)).sum(axis=2); m=d<tol; return tuple(int(np.median(orig[m][:,i])) for i in range(3)), int(m.sum())
bg,_    =center((248,248,248)); fr,nf=center((88,16,104)); fl,nl=center((232,160,0)); dr,nd=center((96,104,192))
pal={'bg':bg,'frame':fr,'flame':fl,'drop':dr}
print('Palette:',{k:'#%02X%02X%02X'%v for k,v in pal.items()})

names=list(pal); cols=np.array([pal[n] for n in names])
dist=((a[:,:,None,:]-cols[None,None,:,:])**2).sum(axis=3)
cls=dist.argmin(axis=2)
# Nur die jeweils größte zusammenhängende Fläche je Farbe behalten (entfernt Übergangs-Konturen)
from scipy import ndimage
for n in ['frame','flame','drop']:
    k=names.index(n); lab,cnt=ndimage.label(cls==k)
    if cnt>1:
        sizes=ndimage.sum(np.ones_like(lab),lab,range(1,cnt+1)); keep=int(np.argmax(sizes))+1
        cls[(cls==k)&(lab!=keep)]=names.index('bg')

def trace(mask):
    bm=potrace.Bitmap(mask)
    plist=bm.trace(turdsize=150, alphamax=1.0, opticurve=True, opttolerance=1.5)
    parts=[]
    f=lambda p: f"{p.x/S:.1f} {p.y/S:.1f}"
    for c in plist:
        d=[f"M{f(c.start_point)}"]
        for s in c.segments:
            if s.is_corner: d.append(f"L{f(s.c)} L{f(s.end_point)}")
            else: d.append(f"C{f(s.c1)} {f(s.c2)} {f(s.end_point)}")
        d.append('Z'); parts.append(''.join(d))
    return ' '.join(parts)

paths={}
for n in ['frame','flame','drop']:
    paths[n]=trace(~(cls==names.index(n)))

# Zuschnitt auf den Inhalt
ys,xs=np.where(cls!=names.index('bg')); x0,x1,y0,y1=xs.min()/S,(xs.max()+1)/S,ys.min()/S,(ys.max()+1)/S
pad=1.0; vb=tuple(float(v) for v in (x0-pad,y0-pad,(x1-x0)+2*pad,(y1-y0)+2*pad))
hexc=lambda v:'#%02X%02X%02X'%v
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb[0]:.2f} {vb[1]:.2f} {vb[2]:.2f} {vb[3]:.2f}" fill="none">
<path fill="{hexc(pal['frame'])}" fill-rule="evenodd" d="{paths['frame']}"/>
<path fill="{hexc(pal['flame'])}" fill-rule="evenodd" d="{paths['flame']}"/>
<path fill="{hexc(pal['drop'])}" fill-rule="evenodd" d="{paths['drop']}"/>
</svg>'''
open(os.path.join(ROOT, 'public', 'logo-mark.svg'),'w').write(svg)
print('viewBox', [round(v,2) for v in vb], '| SVG-Größe', len(svg), 'Bytes')
