import sys; sys.path.insert(0, '../_lemo')
from sfx import *
whooshes(); add(.1, pop(), .6)
add(.3, clank(), .5); add(W('hook', 7), thud(), .9); add(W('hook', 11), pop(), .7)
for i in range(5): add(W('p1', 2) + i * .12, pop(), .25)
add(W('p1', 6), pop(), .6); add(W('p1', 9), crackle(W('p1', 13) - W('p1', 9)), .3); add(W('p1', 13), thud(), .8)
add(T0 := cut('p2'), crackle(W('p2', 11) - T0), .35); add(W('p2', 6), pop(), .6); add(W('p2', 12), thud(), .9)
t = cut('p3')
while t < W('p3', 5): add(t, clank(), .35); t += 1 / 3
add(W('p3', 6), crackle(cut('p4') - W('p3', 6)), .35); add(W('p3', 6), pop(), .6); add(W('p3', 11), pop(), .6)
add(cut('p4'), crackle(cut('cierre') - cut('p4')), .3); add(W('p4', 9), ding(), .6)
add(W('cierre', 5), sweep(.6), .6); add(W('cierre', 5), pop(), .6); add(W('cierre', 8.5), clank(), .6); add(W('cierre', 9), thud(), .7); add(W('cierre', 16), pop(), .7)
write_mix(drops=[W('p1', 13), W('p2', 12)])
