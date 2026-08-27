import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

CATS = {
    "Ana Yemekler": {"en": "Main Dishes", "de": "Hauptgerichte", "ru": "Основные Блюда", "ar": "الأطباق الرئيسية"},
    "Tatlılar": {"en": "Desserts", "de": "Desserts", "ru": "Десерты", "ar": "الحلويات"},
    "Soğuk İçecekler": {"en": "Cold Drinks", "de": "Kalte Getränke", "ru": "Холодные Напитки", "ar": "المشروبات الباردة"},
    "Sıcak İçecekler": {"en": "Hot Drinks", "de": "Heiße Getränke", "ru": "Горячие Напитки", "ar": "المشروبات الساخنة"},
}

# name: (en, de, ru, ar), desc: (en, de, ru, ar)
ITEMS = {
    "Kumpir": {
        "n": ("Kumpir (Stuffed Baked Potato)", "Kumpir (Gefüllte Ofenkartoffel)", "Кумпир (Печёный Картофель)", "كومبير (بطاطس مشوية محشوة)"),
        "d": ("A giant stone-oven baked potato with melting butter and kaşar cheese, crowned with a colorful array of fresh toppings — a legendary treat.",
              "Riesige Ofenkartoffel aus dem Steinofen mit schmelzender Butter und Kaşar-Käse, gekrönt von bunten frischen Zutaten — eine Legende.",
              "Огромный запечённый в каменной печи картофель с тающим маслом и сыром кашар, увенчанный яркими свежими начинками — легендарный вкус.",
              "بطاطس ضخمة مشوية في الفرن الحجري مع زبدة ذائبة وجبنة قشار، مزيّنة بتشكيلة ملوّنة من الإضافات الطازجة — مذاق أسطوري."),
    },
    "Et Burger": {
        "n": ("Beef Burger", "Rindfleisch-Burger", "Бургер из Говядины", "برغر اللحم البقري"),
        "d": ("A daily-made 100% beef patty, seared on the grill with melting cheese and fresh garnishes, served in a soft bun with golden fries.",
              "Täglich frisch zubereitetes 100% Rinderpatty, gegrillt mit schmelzendem Käse und frischen Beilagen, im weichen Brötchen mit Pommes.",
              "Котлета из 100% говядины, обжаренная на гриле с тающим сыром и свежими овощами; подаётся в мягкой булочке с золотистым картофелем.",
              "قرص لحم بقري 100% محضّر يومياً، مشوي مع جبنة ذائبة وخضار طازجة، يقدَّم في خبز طري مع بطاطس ذهبية مقرمشة."),
    },
    "Tavuk Burger": {
        "n": ("Chicken Burger", "Hähnchen-Burger", "Куриный Бургер", "برغر الدجاج"),
        "d": ("Marinated crispy chicken breast with fresh lettuce, tomato and our signature sauce, served with golden crispy fries on the side.",
              "Marinierte knusprige Hähnchenbrust mit frischem Salat, Tomate und Haussoße, serviert mit goldgelben knusprigen Pommes frites.",
              "Маринованная хрустящая куриная грудка со свежим салатом, томатом и фирменным соусом; подаётся с золотистым картофелем фри.",
              "صدر دجاج مقرمش متبّل مع خس طازج وطماطم وصلصتنا الخاصة، يقدَّم مع بطاطس مقلية ذهبية مقرمشة."),
    },
    "Karışık Izgara": {
        "n": ("Mixed Grill", "Gemischte Grillplatte", "Микс-Гриль", "مشاوي مشكّلة"),
        "d": ("A feast of beef tenderloin, butcher's meatballs and chicken chops united over charcoal fire, crowned with rice and grilled garnishes.",
              "Ein Festmahl aus Rinderfilet, Metzger-Frikadellen und Hähnchenkoteletts vom Holzkohlegrill, gekrönt mit Reis und Grillgemüse.",
              "Пиршество из говяжьей вырезки, котлет по-мясницки и куриных отбивных на углях, увенчанное рисом и жареными гарнирами.",
              "وليمة من فيليه البقر وكفتة الجزّار وقطع الدجاج تجتمع على نار الفحم، تتوَّج بالأرز والخضار المشوية."),
    },
    "Pizza Çeşitleri": {
        "n": ("Pizza Selection", "Pizza-Auswahl", "Пиццы", "تشكيلة البيتزا"),
        "d": ("Thin-rolled dough crisped in the stone oven; four artisan pizzas from margherita to kavurma, all loaded with mozzarella.",
              "Dünn ausgerollter Teig, knusprig aus dem Steinofen; vier handwerkliche Pizzen von Margherita bis Kavurma, reich mit Mozzarella belegt.",
              "Тонкое тесто, подрумяненное в каменной печи; четыре авторские пиццы от маргариты до кавурмы, щедро покрытые моцареллой.",
              "عجينة رقيقة مقرمشة من الفرن الحجري؛ أربع بيتزا حرفية من المارغريتا إلى القاورمة، محمّلة بجبنة الموزاريلا."),
    },
    "İçli Köfte": {
        "n": ("İçli Köfte (Stuffed Bulgur)", "İçli Köfte (Gefüllte Bulgur-Klöße)", "Ичли Кёфте", "كبّة (إتشلي كفتة)"),
        "d": ("A thin bulgur shell filled with spiced minced meat and walnuts; crispy outside, tender inside — a traditional Anatolian classic.",
              "Dünne Bulgur-Hülle, gefüllt mit gewürztem Hackfleisch und Walnüssen; außen knusprig, innen zart — ein anatolischer Klassiker.",
              "Тонкая оболочка из булгура с начинкой из пряного фарша и грецких орехов; хрустящая снаружи, нежная внутри — анатолийская классика.",
              "قشرة رقيقة من البرغل محشوّة باللحم المفروم المتبّل والجوز؛ مقرمشة من الخارج طرية من الداخل — كلاسيكية أناضولية تقليدية."),
    },
    "Çorba Çeşitleri": {
        "n": ("Soups", "Suppen", "Супы", "الشوربات"),
        "d": ("Lentil and seasonal soups cooked daily with fresh ingredients, served with sizzling butter sauce and crispy croutons.",
              "Täglich frisch gekochte Linsen- und Saisonsuppen, serviert mit heißer Buttersoße und knusprigen Croutons.",
              "Чечевичный и сезонные супы, приготовленные ежедневно из свежих продуктов; подаются с топлёным маслом и хрустящими гренками.",
              "شوربة العدس وشوربات موسمية تُطهى يومياً بمكونات طازجة، تقدَّم مع صلصة الزبدة الساخنة وخبز محمّص مقرمش."),
    },
    "Patates Kızartması": {
        "n": ("French Fries", "Pommes Frites", "Картофель Фри", "بطاطس مقلية"),
        "d": ("Carefully selected potatoes double-fried to perfection — golden and crispy outside, soft as cotton inside.",
              "Sorgfältig ausgewählte Kartoffeln, doppelt frittiert — außen goldbraun und knusprig, innen weich wie Watte.",
              "Отборный картофель двойной обжарки — золотистый и хрустящий снаружи, мягкий как пух внутри.",
              "بطاطس مختارة بعناية ومقلية مرتين حتى الكمال — ذهبية مقرمشة من الخارج وناعمة كالقطن من الداخل."),
    },
    "Tost Çeşitleri": {
        "n": ("Toasted Sandwiches", "Toast-Variationen", "Тосты", "تشكيلة التوست"),
        "d": ("Pressed and grilled to perfection with generous kaşar, sucuk or mixed fillings — crispy outside, hot and melting inside.",
              "Perfekt gepresst und gegrillt mit reichlich Kaşar, Sucuk oder gemischter Füllung — außen knusprig, innen heiß und schmelzend.",
              "Прожаренные под прессом тосты с щедрой начинкой из кашара, суджука или микса — хрустящие снаружи, горячие и тянущиеся внутри.",
              "توست مضغوط ومشوي بإتقان مع جبنة قشار وفيرة أو سجق أو حشوة مشكّلة — مقرمش من الخارج ساخن وذائب من الداخل."),
    },
    "Sucuklu Yumurta": {
        "n": ("Eggs with Sucuk", "Eier mit Sucuk", "Яичница с Суджуком", "بيض بالسجق"),
        "d": ("Authentic butcher's sucuk slowly sautéed in butter, meeting village eggs — a breakfast classic served sizzling in the pan.",
              "Echte Metzger-Sucuk, langsam in Butter angebraten, trifft auf Landeier — ein Frühstücksklassiker, brutzelnd in der Pfanne serviert.",
              "Настоящий суджук, медленно обжаренный в масле, с деревенскими яйцами — классика завтрака, подаётся шипящей на сковороде.",
              "سجق أصلي يُقلى ببطء في الزبدة مع بيض بلدي — كلاسيكية الفطور تقدَّم وهي تتقافز حرارةً في المقلاة."),
    },
    "Salata Çeşitleri": {
        "n": ("Salads", "Salate", "Салаты", "السلطات"),
        "d": ("Daily-washed crisp greens tossed with tuna, white cheese or seasonal vegetables — freshness dressed in olive oil.",
              "Täglich gewaschene knackige Blattsalate mit Thunfisch, Weißkäse oder Saisongemüse — Frische mit Olivenöl angemacht.",
              "Свежая хрустящая зелень с тунцом, белым сыром или сезонными овощами — свежесть, заправленная оливковым маслом.",
              "خضار ورقية مقرمشة تُغسل يومياً مع تونة أو جبنة بيضاء أو خضار موسمية — نضارة بتتبيلة زيت الزيتون."),
    },
    "Serpme Kahvaltı": {
        "n": ("Turkish Breakfast Spread", "Türkisches Frühstück (Serpme)", "Турецкий Завтрак", "فطور تركي مشكّل"),
        "d": ("A long, joyful table of regional cheeses, homemade jams, sizzling pans and fresh breads, accompanied by brewed Turkish tea.",
              "Eine lange, genussvolle Tafel mit regionalen Käsesorten, hausgemachten Marmeladen, heißen Pfannen und frischem Brot, dazu türkischer Tee.",
              "Долгий щедрый стол из местных сыров, домашнего варенья, горячих сковородок и свежего хлеба в сопровождении крепкого турецкого чая.",
              "مائدة طويلة ممتعة من الأجبان المحلية والمربّيات المنزلية والمقالي الساخنة والخبز الطازج، برفقة الشاي التركي المخمّر."),
    },
    "Waffle": {
        "n": ("Waffle", "Waffel", "Вафли", "وافل"),
        "d": ("Warm waffle batter crowned with Belgian chocolate, fresh banana, strawberry and kiwi — a crispy bite of happiness every time.",
              "Warmer Waffelteig, gekrönt mit belgischer Schokolade, frischer Banane, Erdbeere und Kiwi — knuspriges Glück in jedem Bissen.",
              "Тёплая вафля, увенчанная бельгийским шоколадом, свежим бананом, клубникой и киви — хрустящее счастье в каждом кусочке.",
              "وافل ساخن متوَّج بشوكولاتة بلجيكية وموز طازج وفراولة وكيوي — قضمة مقرمشة من السعادة في كل مرة."),
    },
    "Künefe": {
        "n": ("Künefe", "Künefe", "Кюнефе", "كنافة"),
        "d": ("Shredded kadayıf pastry with stretchy künefe cheese inside, topped with pistachios and served hot with syrup — a true feast.",
              "Fein zerzupfter Kadayıf-Teig mit dehnbarem Künefe-Käse, mit Pistazien bestreut und heiß mit Sirup serviert — ein wahres Fest.",
              "Тонкая кадаифная вермишель с тянущимся сыром внутри, посыпанная фисташками и подаваемая горячей с сиропом — настоящий праздник.",
              "كنافة بجبنة مطاطية خاصة داخل شعيرات الكادايف، مزيّنة بالفستق الحلبي وتقدَّم ساخنة مع القطر — وليمة حقيقية."),
    },
    "Katmer": {
        "n": ("Katmer", "Katmer", "Катмер", "قطمر"),
        "d": ("Paper-thin dough wrapped around clotted cream and Antep pistachios, baked to a delicate crisp — a refined Gaziantep dessert.",
              "Hauchdünner Teig, gefüllt mit Rahm und Antep-Pistazien, zart knusprig gebacken — ein feines Dessert nach Gaziantep-Art.",
              "Тончайшее тесто с каймаком и фисташками из Антепа, выпеченное до нежного хруста — изысканный десерт из Газиантепа.",
              "عجينة رقيقة كالورق ملفوفة بالقشطة وفستق عنتاب، مخبوزة حتى القرمشة الرقيقة — حلوى راقية على طريقة غازي عنتاب."),
    },
    "Sufle": {
        "n": ("Chocolate Soufflé", "Schokoladen-Soufflé", "Шоколадный Суфле", "سوفليه الشوكولاتة"),
        "d": ("A gently risen warm cake with rich Belgian chocolate flowing from its heart, served with a scoop of vanilla ice cream.",
              "Sanft aufgegangener warmer Kuchen mit flüssiger belgischer Schokolade im Kern, serviert mit einer Kugel Vanilleeis.",
              "Тёплый воздушный кекс с текущим сердцем из бельгийского шоколада; подаётся с шариком ванильного мороженого.",
              "كيكة دافئة منتفخة برفق يتدفق من قلبها شوكولاتة بلجيكية غنية، تقدَّم مع كرة من آيس كريم الفانيليا."),
    },
    "Sütlaç": {
        "n": ("Baked Rice Pudding (Sütlaç)", "Milchreis aus dem Ofen (Sütlaç)", "Сютлач (Рисовый Пудинг)", "أرز بالحليب (سوتلاتش)"),
        "d": ("Baked in the stone oven until caramelized on top; perfectly creamy milk rice meeting crunchy hazelnuts — a traditional delight.",
              "Im Steinofen gebacken, bis die Oberfläche karamellisiert; cremiger Milchreis trifft auf knackige Haselnüsse — traditioneller Genuss.",
              "Запечённый в каменной печи до карамельной корочки; нежнейший молочный рис с хрустящим фундуком — традиционное лакомство.",
              "يُخبز في الفرن الحجري حتى تتكرمل قمته؛ أرز بالحليب بقوام مثالي يلتقي بالبندق — متعة تقليدية أصيلة."),
    },
    "Trileçe": {
        "n": ("Trileçe (Tres Leches)", "Trileçe (Tres-Leches-Kuchen)", "Трилече", "تريليتشه"),
        "d": ("A cotton-soft cake soaked in three kinds of milk under a glossy caramel glaze — light, cool and perfectly sweet.",
              "Wattig-weicher Kuchen, getränkt in drei Milchsorten, unter glänzender Karamellglasur — leicht, kühl und genau richtig süß.",
              "Нежнейший бисквит, пропитанный тремя видами молока, под блестящей карамельной глазурью — лёгкий, прохладный, в меру сладкий.",
              "كيكة قطنية النعومة منقوعة بثلاثة أنواع من الحليب تحت طبقة كراميل لامعة — خفيفة ومنعشة وحلاوتها متوازنة."),
    },
    "Milkshake Çeşitleri": {
        "n": ("Milkshakes", "Milchshakes", "Милкшейки", "ميلك شيك"),
        "d": ("Fresh daily milk and real fruit whipped with ice cream into thick, creamy coolness — strawberry, banana, melon and chocolate.",
              "Frische Milch und echtes Obst, mit Eis zu dickflüssiger cremiger Kühle aufgeschlagen — Erdbeere, Banane, Melone und Schokolade.",
              "Свежее молоко и настоящие фрукты, взбитые с мороженым в густую кремовую прохладу — клубника, банан, дыня и шоколад.",
              "حليب طازج وفواكه حقيقية تُخفق مع الآيس كريم لقوام كثيف كريمي منعش — فراولة وموز وشمام وشوكولاتة."),
    },
    "Frozen Çeşitleri": {
        "n": ("Frozen Fruit Slushes", "Frozen-Fruchtgetränke", "Фроузен (Фруктовый Лёд)", "مشروبات فروزن"),
        "d": ("Fresh fruit purée blended with crushed ice into its most refreshing form — summer coolness in kiwi, strawberry and melon.",
              "Frisches Fruchtpüree mit Crushed Ice zur erfrischendsten Form gemixt — Sommerkühle in Kiwi, Erdbeere und Melone.",
              "Пюре из свежих фруктов, взбитое со льдом до самой освежающей формы — летняя прохлада со вкусом киви, клубники и дыни.",
              "بوريه فواكه طازجة ممزوج بالثلج المجروش في أكثر أشكاله انتعاشاً — برودة الصيف بنكهات الكيوي والفراولة والشمام."),
    },
    "Buzlu Kahve Çeşitleri": {
        "n": ("Iced Coffees", "Eiskaffee-Variationen", "Айс-Кофе", "قهوة مثلّجة"),
        "d": ("Bold espresso balanced with cold milk and ice, refreshed with touches of caramel and vanilla — chilled coffee classics.",
              "Kräftiger Espresso, ausbalanciert mit kalter Milch und Eis, verfeinert mit Karamell und Vanille — eisgekühlte Kaffeeklassiker.",
              "Крепкий эспрессо в балансе с холодным молоком и льдом, с нотками карамели и ванили — освежающая кофейная классика.",
              "إسبريسو غني متوازن مع الحليب البارد والثلج، بلمسات الكراميل والفانيليا — كلاسيكيات القهوة المثلّجة المنعشة."),
    },
    "Taze Meyve Suları": {
        "n": ("Fresh-Squeezed Juices", "Frisch Gepresste Säfte", "Свежевыжатые Соки", "عصائر طازجة"),
        "d": ("Cold-pressed orange, apple and carrot squeezed the moment you order — pure, additive-free and vitamin-packed freshness.",
              "Kalt gepresste Orange, Apfel und Karotte, frisch bei Bestellung — pure, zusatzfreie und vitaminreiche Frische.",
              "Апельсин, яблоко и морковь холодного отжима, приготовленные в момент заказа — чистая свежесть без добавок, полная витаминов.",
              "برتقال وتفاح وجزر بعصر بارد لحظة الطلب — نضارة نقية خالية من الإضافات ومليئة بالفيتامينات."),
    },
    "Atom & Limonata": {
        "n": ("Atom & Lemonade", "Atom & Limonade", "Атом и Лимонад", "أتوم وليموناضة"),
        "d": ("Pomegranate juice, the energizing 'atom' mix and homemade mint lemonade — a natural trio served ice-cold to power your day.",
              "Granatapfelsaft, der energiereiche 'Atom'-Mix und hausgemachte Minz-Limonade — ein natürliches Trio, eiskalt serviert.",
              "Гранатовый сок, бодрящий микс «атом» и домашний мятный лимонад — природное трио, подаётся ледяным для заряда энергии.",
              "عصير رمان وخلطة «أتوم» المنشّطة وليموناضة منزلية بالنعناع — ثلاثي طبيعي يقدَّم مثلّجاً ليمنحك الطاقة."),
    },
    "Kutu İçecekler": {
        "n": ("Canned Drinks", "Dosengetränke", "Напитки в Банках", "مشروبات معلّبة"),
        "d": ("Ice-cold sparkling and fruity canned drinks for every taste — cola, soda, iced tea and fruit nectar varieties.",
              "Eiskalte Limonaden und fruchtige Dosengetränke für jeden Geschmack — Cola, Brause, Eistee und Fruchtnektar.",
              "Ледяные газированные и фруктовые напитки на любой вкус — кола, газировка, холодный чай и фруктовые нектары.",
              "مشروبات معلّبة غازية وفواكه مثلّجة لكل الأذواق — كولا وصودا وشاي مثلّج ورحيق فواكه."),
    },
    "Türk Kahvesi": {
        "n": ("Turkish Coffee", "Türkischer Kaffee", "Кофе по-Турецки", "قهوة تركية"),
        "d": ("Brewed slowly in a copper cezve over low heat until richly foamy; served with Turkish delight and water — a 500-year ritual.",
              "Langsam in der Kupferkanne über kleiner Flamme gebrüht, bis reichlich Schaum entsteht; mit Lokum und Wasser — ein 500-jähriges Ritual.",
              "Медленно сваренный в медной джезве на слабом огне до густой пенки; подаётся с лукумом и водой — ритуал с пятивековой историей.",
              "تُطهى ببطء في ركوة نحاسية على نار هادئة حتى تعلوها رغوة غنية؛ تقدَّم مع راحة الحلقوم والماء — طقس عمره خمسة قرون."),
    },
    "Espresso": {
        "n": ("Espresso", "Espresso", "Эспрессо", "إسبريسو"),
        "d": ("Single-origin beans extracted at ideal pressure — a short but powerful sip with dense crema and balanced acidity.",
              "Single-Origin-Bohnen bei idealem Druck extrahiert — ein kurzer, kraftvoller Schluck mit dichter Crema und ausgewogener Säure.",
              "Зёрна одного происхождения под идеальным давлением — короткий, но мощный глоток с плотной крема и сбалансированной кислотностью.",
              "حبوب أحادية المصدر تُستخلص بضغط مثالي — رشفة قصيرة لكنها قوية بكريما كثيفة وحموضة متوازنة."),
    },
    "Latte": {
        "n": ("Latte", "Latte", "Латте", "لاتيه"),
        "d": ("Silky steamed milk embracing freshly pulled espresso, finished with latte art — a smooth, easy-drinking classic.",
              "Seidig aufgeschäumte Milch umarmt frisch gebrühten Espresso, vollendet mit Latte Art — ein sanfter, süffiger Klassiker.",
              "Шелковистое взбитое молоко в объятиях свежего эспрессо, украшенное латте-артом — мягкая и лёгкая классика.",
              "حليب مبخّر حريري يعانق إسبريسو طازجاً، يكتمل بفن اللاتيه — كلاسيكية ناعمة سهلة الاحتساء."),
    },
    "Cappuccino": {
        "n": ("Cappuccino", "Cappuccino", "Капучино", "كابتشينو"),
        "d": ("Equal parts espresso, hot milk and velvety foam, finished with a touch of cinnamon — Italian elegance in a cup.",
              "Espresso, heiße Milch und samtiger Schaum zu gleichen Teilen, vollendet mit einem Hauch Zimt — italienische Eleganz in der Tasse.",
              "Эспрессо, горячее молоко и бархатная пенка в равных частях, с лёгкой ноткой корицы — итальянская элегантность в чашке.",
              "مقادير متساوية من الإسبريسو والحليب الساخن والرغوة المخملية، بلمسة قرفة — أناقة إيطالية في فنجان."),
    },
    "Americano": {
        "n": ("Americano", "Americano", "Американо", "أمريكانو"),
        "d": ("A double espresso opened up with hot water into filter-like smoothness — a balanced coffee to accompany your whole day.",
              "Doppelter Espresso, mit heißem Wasser zu filterartiger Milde verlängert — ein ausgewogener Kaffee für den ganzen Tag.",
              "Двойной эспрессо, раскрытый горячей водой до мягкости фильтр-кофе — сбалансированный напиток на весь день.",
              "إسبريسو مزدوج يُمدَّد بالماء الساخن ليكتسب نعومة القهوة المقطّرة — قهوة متوازنة ترافقك طوال اليوم."),
    },
    "Filtre Kahve": {
        "n": ("Filter Coffee", "Filterkaffee", "Фильтр-Кофе", "قهوة مقطّرة"),
        "d": ("Freshly ground beans brewed drop by drop — a generous, easy-drinking cup with distinctly fruity notes.",
              "Frisch gemahlene Bohnen, Tropfen für Tropfen gebrüht — eine große, süffige Tasse mit deutlich fruchtigen Noten.",
              "Свежемолотые зёрна, заваренные капля за каплей — большая чашка лёгкого кофе с выраженными фруктовыми нотами.",
              "حبوب مطحونة طازجاً تُخمَّر قطرة قطرة — فنجان سخي سهل الاحتساء بنكهات فاكهية مميزة."),
    },
    "Çay Çeşitleri": {
        "n": ("Tea Selection", "Tee-Auswahl", "Чайная Карта", "تشكيلة الشاي"),
        "d": ("Strong Rize tea in a tulip glass and healing herbal teas — linden, sage, rosehip and mint-lemon varieties.",
              "Kräftiger Rize-Tee im Tulpenglas und wohltuende Kräutertees — Linde, Salbei, Hagebutte und Minze-Zitrone.",
              "Крепкий ризе-чай в тюльпановидном стакане и целебные травяные чаи — липа, шалфей, шиповник и мята-лимон.",
              "شاي ريزه القوي في كأس تركي تقليدي وشاي أعشاب شافٍ — زيزفون ومريمية وثمر الورد ونعناع بليمون."),
    },
    "Salep": {
        "n": ("Salep", "Salep", "Салеп", "سحلب"),
        "d": ("Genuine salep root thickened with hot milk and generously dusted with cinnamon — winter's nostalgic warming companion.",
              "Echte Salep-Wurzel, mit heißer Milch angedickt und großzügig mit Zimt bestreut — der nostalgische Wärmespender des Winters.",
              "Настоящий корень салепа, заваренный на горячем молоке и щедро посыпанный корицей — согревающий ностальгический друг зимы.",
              "جذور السحلب الأصلية بقوام كثيف مع الحليب الساخن ورشّة قرفة سخية — رفيق الشتاء الدافئ الحنين."),
    },
    "Sıcak Çikolata": {
        "n": ("Hot Chocolate", "Heiße Schokolade", "Горячий Шоколад", "شوكولاتة ساخنة"),
        "d": ("Real melted chocolate thickened with hot milk and crowned with cream — a velvety, heart-warming winter classic.",
              "Echte geschmolzene Schokolade, mit heißer Milch verdichtet und mit Sahne gekrönt — ein samtiger, wärmender Winterklassiker.",
              "Настоящий растопленный шоколад, сгущённый горячим молоком и увенчанный сливками — бархатная согревающая зимняя классика.",
              "شوكولاتة حقيقية مذوّبة بقوام غني مع الحليب الساخن ومتوَّجة بالكريمة — كلاسيكية شتوية مخملية تدفئ القلب."),
    },
}


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]
    for name, tr in CATS.items():
        await db.categories.update_one({"name": name}, {"$set": {
            "name_en": tr["en"], "name_de": tr["de"], "name_ru": tr["ru"], "name_ar": tr["ar"]}})
    updated = 0
    for name, data in ITEMS.items():
        n, d = data["n"], data["d"]
        r = await db.menu_items.update_one({"name": name}, {"$set": {
            "name_en": n[0], "name_de": n[1], "name_ru": n[2], "name_ar": n[3],
            "description_en": d[0], "description_de": d[1], "description_ru": d[2], "description_ar": d[3],
        }})
        updated += r.modified_count
        if r.matched_count == 0:
            print("NOT FOUND:", name)
    print("items updated:", updated, "/", len(ITEMS))
    client.close()

asyncio.run(main())
