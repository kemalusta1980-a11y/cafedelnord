#!/bin/bash
cd /app/frontend/public/images
B="http://www.cafedelnord.com.tr/wp-content/uploads"
declare -A M=(
  [kumpir.jpg]="$B/2025/11/Kumpir.jpg"
  [et-burger.jpg]="$B/2025/11/hamburger1.jpg"
  [tavuk-burger.jpg]="$B/2025/11/hamburger3.jpg"
  [pizza.jpg]="$B/2025/11/pizzas.jpg"
  [icli-kofte.jpg]="$B/2025/11/iclikofte.jpg"
  [sucuklu-yumurta.jpg]="$B/2025/11/sucukluy-1.jpg"
  [nord-banner.jpg]="$B/2025/11/NORD-BANNER-2048x1152-1.jpg"
  [karisik-izgara.jpg]="$B/2021/02/karisikizgara.jpg"
  [corba.jpg]="$B/2021/02/corba.jpg"
  [patates.jpg]="$B/2021/02/patates-kizartmasi.jpg"
  [salata.jpg]="$B/2021/02/salata.jpg"
  [serpme.jpg]="$B/2021/02/serpme.jpg"
  [waffle.jpg]="$B/2021/02/waffle.jpg"
  [kunefe.jpg]="$B/2021/02/Kunefe.jpg"
  [katmer.jpg]="$B/2021/02/katmer.jpg"
  [sufle.jpg]="$B/2021/02/sufle.jpg"
  [sutlac.jpg]="$B/2021/02/sutlac.jpg"
  [trilece.jpg]="$B/2021/02/trilece.jpg"
  [milkshake.jpg]="$B/2021/02/milkshake.jpg"
  [frozen.jpg]="$B/2021/02/frozen.jpg"
  [buzlu-kahve.jpg]="$B/2021/02/buzlu-kahve.jpg"
  [meyve-suyu-1.jpg]="$B/2021/02/tazemeyve1.jpg"
  [meyve-suyu-2.jpg]="$B/2021/02/tazemeyvesulari2.jpg"
  [kutu-icecek.jpg]="$B/2021/02/kutuicecekler.jpg"
  [cay.jpg]="$B/2021/02/C%CC%A7ay-c%CC%A7es%CC%A7itleri.jpg"
  [salep.jpg]="$B/2021/02/salepx.jpg"
  [sicak-cikolata.jpg]="$B/2021/02/sicakcikolata.jpg"
  [turk-kahvesi.jpg]="$B/2021/02/tu%CC%88rkkahvesi.jpg"
  [espresso.jpg]="$B/2021/02/espresso.jpg"
  [latte.jpg]="$B/2021/02/latte.jpg"
  [cappuccino.jpg]="$B/2021/02/CAPPUCCI%CC%87NO.jpg"
  [americano.jpg]="$B/2021/02/americano.jpg"
  [filtre-kahve.jpg]="$B/2021/02/filtre-kahve.jpg"
  [kahve-atmosfer.jpg]="$B/2021/02/xc.jpg"
  [tatli-atmosfer.jpg]="$B/2021/02/shutterstock_1647372625.jpg"
  [icecek-atmosfer.jpg]="$B/2021/02/shutterstock_398837842.jpg"
  [burger-atmosfer.jpg]="$B/2021/02/t21.jpg"
)
for f in "${!M[@]}"; do
  if [ ! -s "$f" ]; then
    curl -sL --max-time 30 "${M[$f]}" -o "$f" &
  fi
done
wait
for f in "${!M[@]}"; do
  if [ ! -s "$f" ] || ! head -c 3 "$f" | grep -q $'\xff\xd8'; then rm -f "$f"; echo "FAILED: $f"; fi
done
echo "DONE"; ls | wc -l
