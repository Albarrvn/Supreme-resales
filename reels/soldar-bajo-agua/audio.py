import sys; sys.path.insert(0, '../_lemo')
from sfx import *
def blub(): t = tt(.12); return np.sin(2 * np.pi * np.cumsum(np.linspace(220, 900, len(t))) / SR) * env(.12, .004, 22) * .7   # bubble pop
def muffled(d): return lp(crackle(d), .12) * 2.2                                                                          # arc heard through water
def bubbles_bed(t0, d, rate=5):
    for i in range(int(d * rate)): add(t0 + i / rate + rng.random() * .15, blub(), .25 + rng.random() * .25)
add(0, thud(), 1.); add(0.02, crack(), .5); add(0, muffled(cut('pregunta')), .5); bubbles_bed(0, cut('burbuja'), 4)   # hook hits on frame 0
add(W('hook', 13), pop(), .6); add(W('hook', 22), thud(), .9); add(W('hook', 22), clank(), .4)
whooshes()
add(W('pregunta', 4), pop(), .8); add(W('pregunta', 8), sweep(.8), .7)
add(cut('burbuja'), muffled(cut('electrodo') - cut('burbuja')), .45); add(W('burbuja', 4), pop(), .6)
bubbles_bed(W('burbuja', 6), W('burbuja', 16) - W('burbuja', 6), 9); add(W('burbuja', 13), hiss(1.5), .3)
add(W('burbuja', 16), sweep(.6), .6); add(W('burbuja', 18), blub(), .9); add(W('burbuja', 18), ding(1318), .5); add(W('burbuja', 25), thud(), .7); add(W('burbuja', 25), ding(1760), .5)
add(cut('electrodo') + .1, sweep(.5), .5); add(W('electrodo', 5), pop(), .7); add(W('electrodo', 8), ding(1568), .5)
for i in range(6): add(W('electrodo', 11) + i * .35, blub(), .5)
add(W('electrodo', 16), ding(2093), .5)
add(W('corriente', 3), pop(), .7); add(W('corriente', 5), pop(), .7); add(W('corriente', 5) + .1, clank(), .3)
add(W('corriente', 7) - .2, sweep(.5), .7); add(W('corriente', 13), pop(), .6); add(W('corriente', 15), pop(), .7)
on = W('corriente', 23); add(on, clank(), .9); add(on, crack(), .7); add(on + .1, muffled(cut('peligro') - on - .1), .45)
add(W('peligro', 6), pop(), .7); add(W('peligro', 7), crackle(W('peligro', 12) - W('peligro', 7)), .6); add(W('peligro', 7), crack(), .6)
add(W('peligro', 12), pop(), .7); bubbles_bed(W('peligro', 14), 2, 8); add(W('peligro', 21), pop(), .6)
boomT = W('peligro', 24); add(boomT, thud(), 1.); add(boomT, crack(), 1.); add(boomT + .03, thud(), .8)
add(W('peligro', 25), pop(), .7); add(W('peligro', 33), sweep(1.2), .5); bubbles_bed(W('peligro', 33), 1.5, 8)
add(W('calidad', 4), hiss(2), .6); add(W('calidad', 7), pop(), .7)
add(W('calidad', 16) - .2, sweep(.5), .7); add(W('calidad', 16), crackle(cut('cierre') - W('calidad', 16)), .3); add(W('calidad', 22), ding(1568), .5)
add(cut('cierre') + .1, pop(), .7); add(W('cierre', 12), pop(), .8); add(W('cierre', 14), pop(), .8)
add(W('cierre', 18), thud(), .9); add(W('cierre', 18), ding(2093), .7); bubbles_bed(cut('cierre'), T_END - cut('cierre') if 'T_END' in dir() else 6, 3)
write_mix(drops=[W('hook', 22), on, boomT])
