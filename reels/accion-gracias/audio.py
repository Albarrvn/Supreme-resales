import sys; sys.path.insert(0, '../_lemo')
from sfx import *
add(0, thud(), 1.); add(0.02, crack(), .5); add(0, ding(1318), .4)                         # hook hits on frame 0
add(W('hook', 7), pop(), .7); reveal = W('hook', 10)
add(reveal - .25, sweep(.5), .7); add(reveal, thud(), 1.); add(reveal, clank(), .6); add(reveal + .05, ding(1568), .7); add(reveal + .2, ding(2093), .5)
add(W('hook', 13), thud(), .7)
whooshes()
add(W('gracias', 2), ding(1318), .6); add(W('gracias', 4), pop(), .7)
for i in (7, 9, 12): add(W('gracias', i), pop(), .8)
add(W('gracias', 13), pop(), .6)
op = W('regalo', 9)
add(op - .4, crackle(.4), .3); add(op, thud(), 1.); add(op, crack(), .7); add(op + .05, ding(1760), .7)
add(W('regalo', 11), sweep(.4), .5); add(W('regalo', 12), pop(), .8); add(W('regalo', 15), pop(), .7); add(W('regalo', 17), pop(), .7); add(W('regalo', 20), thud(), .6); add(W('regalo', 20), ding(2093), .5)
for k in ('uno', 'dos', 'tres', 'cuatro', 'cinco'):
    fe = S[k]['end'] - .5
    add(fe - .6, crackle(.6), .45); add(fe, clank(), .5); add(fe, ding(1568), .5)               # a feather gets welded on the turkey
for i in (4, 6, 8): add(W('uno', i), pop(), .7)
add(W('dos', 3), sweep(.4), .5); add(W('dos', 9), sweep(.4), .5); add(W('dos', 13), ding(1318), .4)
add(W('tres', 5), crackle(S['tres']['end'] - W('tres', 5) - .7), .3); add(W('tres', 9), pop(), .8); add(W('tres', 13), sweep(.5), .5)
add(cut('cuatro'), crackle(1.6), .3); add(W('cuatro', 4), pop(), .7); add(W('cuatro', 9), pop(), .7); add(W('cuatro', 10), ding(1318), .4)
add(W('cinco', 3), sweep(.35), .6); add(W('cinco', 5), pop(), .7); add(W('cinco', 7), pop(), .7); add(W('cinco', 8), pop(), .7)
add(W('pavo', 6), thud(), 1.); add(W('pavo', 6), ding(1568), .7); add(W('pavo', 6) + .15, ding(2093), .6)
for i in range(5): add(cut('pluma') + i * .12, pop(), .6)
add(cut('cierre') + .1, pop(), .7); add(W('cierre', 7), pop(), .7); add(W('cierre', 13), pop(), .6)
add(W('cierre', 16), thud(), .8); add(W('cierre', 16), ding(1760), .6); add(W('cierre', 21), thud(), .9); add(W('cierre', 21), ding(2093), .7)
write_mix(drops=[reveal, op, W('pavo', 6)])
