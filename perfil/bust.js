// Shared welder bust (1080x1080 coords), used by navidad.html and banner.html
const O = '#1E1B3A', SK = '#8D5A3B', SK2 = '#7A4C31', BE = '#2A1D17';
function bustSVG() { let s = '';
// body: orange shirt, blue overall straps, brown apron
s += `<g stroke="${O}" stroke-width="8" stroke-linejoin="round">
<path d="M150 1080 Q170 860 330 820 L750 820 Q910 860 930 1080Z" fill="#E8762B"/>
<path d="M330 1080 L350 860 L730 860 L750 1080Z" fill="#3E6DB5"/>
<path d="M400 1080 L410 920 L670 920 L680 1080Z" fill="#C98E5A"/>
<rect x="470" y="950" width="70" height="44" rx="8" fill="#fff" stroke-width="6"/><circle cx="492" cy="972" r="9" fill="#3E6DB5" stroke="none"/><rect x="508" y="966" width="22" height="8" rx="3" fill="#E63946" stroke="none"/>
<path d="M380 860 L360 1080 M700 860 L720 1080" fill="none" stroke-width="8"/>
<path d="M455 760 L455 830 Q540 870 625 830 L625 760Z" fill="${SK2}"/>
</g>`;
// head
s += `<g stroke="${O}" stroke-width="8" stroke-linejoin="round">
<ellipse cx="318" cy="590" rx="44" ry="58" fill="${SK}"/><ellipse cx="762" cy="590" rx="44" ry="58" fill="${SK}"/>
<path d="M330 520 Q330 330 540 330 Q750 330 750 520 L750 620 Q750 800 540 812 Q330 800 330 620Z" fill="${SK}"/>
<path d="M330 600 Q340 700 400 760 Q470 820 540 822 Q610 820 680 760 Q740 700 750 600 Q720 650 690 640 Q640 730 540 732 Q440 730 390 640 Q360 650 330 600Z" fill="${BE}"/>
<path d="M440 640 Q490 606 540 628 Q590 606 640 640 Q600 650 540 646 Q480 650 440 640Z" fill="${BE}"/>
<path d="M455 664 Q540 742 625 664 Q540 690 455 664Z" fill="#fff"/>
<path d="M466 674 Q540 728 614 674" fill="none" stroke-width="5"/>
<path d="M512 560 Q540 600 568 560" fill="none" stroke="${SK2}" stroke-width="10" stroke-linecap="round"/>
<ellipse cx="452" cy="520" rx="46" ry="50" fill="#fff"/><ellipse cx="628" cy="520" rx="46" ry="50" fill="#fff"/>
<circle cx="458" cy="526" r="24" fill="#6B3E1F"/><circle cx="622" cy="526" r="24" fill="#6B3E1F"/>
<circle cx="458" cy="526" r="12" fill="${O}" stroke="none"/><circle cx="622" cy="526" r="12" fill="${O}" stroke="none"/>
<circle cx="466" cy="516" r="7" fill="#fff" stroke="none"/><circle cx="630" cy="516" r="7" fill="#fff" stroke="none"/>
<path d="M400 452 Q450 426 500 448" fill="none" stroke="${BE}" stroke-width="16" stroke-linecap="round"/><path d="M580 448 Q630 426 680 452" fill="none" stroke="${BE}" stroke-width="16" stroke-linecap="round"/>
<ellipse cx="400" cy="600" rx="26" ry="14" fill="#C96A5A" opacity=".5" stroke="none"/><ellipse cx="680" cy="600" rx="26" ry="14" fill="#C96A5A" opacity=".5" stroke="none"/>
</g>`;
// welding helmet flipped up on the forehead, cyan visor
s += `<g stroke="${O}" stroke-width="9" stroke-linejoin="round">
<path d="M300 430 Q290 250 540 238 Q790 250 780 430 Q700 396 540 396 Q380 396 300 430Z" fill="#23262E"/>
<rect x="392" y="286" width="296" height="74" rx="30" fill="#0F3A44"/>
<rect x="408" y="298" width="264" height="50" rx="22" fill="#38E1FF" stroke-width="5"/>
<rect x="428" y="306" width="90" height="12" rx="6" fill="#fff" opacity=".75" stroke="none"/>
<circle cx="306" cy="416" r="20" fill="#3B4252"/><circle cx="774" cy="416" r="20" fill="#3B4252"/>
</g><rect x="400" y="290" width="280" height="66" rx="30" fill="#38E1FF" opacity=".25"/>`;
// Santa hat on top of the helmet, tip flopping right
s += `<g stroke="${O}" stroke-width="9" stroke-linejoin="round">
<path d="M330 268 Q380 60 600 70 Q760 80 850 230 Q870 300 830 330 Q790 250 720 200 Q760 260 750 270Z" fill="#E63946"/>
<path d="M600 90 Q700 100 780 190" fill="none" stroke="#FF6B75" stroke-width="12" stroke-linecap="round" opacity=".8"/>
<path d="M300 290 Q300 240 360 236 Q540 222 720 236 Q780 240 780 290 Q780 326 720 318 Q540 300 360 318 Q300 326 300 290Z" fill="#fff"/>
<circle cx="842" cy="340" r="52" fill="#fff"/>
</g>`;
return s; }
