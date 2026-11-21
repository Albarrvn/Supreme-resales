import sys; sys.path.insert(0, '../_lemo')
from sfx import *
whooshes(); add(.1, pop(), .6); add(W('hook', 1), pop(), .6)
add(W('hook', 8), sweep(cut('c1') - W('hook', 8)), .8); add(W('hook', 12), ding(), .6)
add(W('c1', 4), pop(), .6); add(W('c1', 7), pop(), .6); add(W('c2', 4), pop(), .6); add(W('c2', 7), pop(), .6)
add(W('c3', 1), ding(1568), .5); add(W('c3', 6), thud(), .9); add(W('c3', 6.1), ding(1760), .6)
add(W('c4', 3), crack(), .7); add(W('c4', 9), sweep(.5), .7); add(W('c4', 11.6), clank(), 1.); add(W('c4', 11.6), thud(), 1.)
add(W('c4', 11.8), sweep(1.0), .6); add(W('cierre', 14), pop(), .7)
write_mix(drops=[W('c4', 11.6)])
