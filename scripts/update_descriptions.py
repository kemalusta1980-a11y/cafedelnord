import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

DESCS = {
    "Kumpir": "Taş fırında kavrulan iri boy patatesin içinde eriyen tereyağı ve kaşarın, rengarenk taze malzemelerle buluştuğu efsane lezzet.",
    "Et Burger": "Günlük hazırlanan yüzde yüz dana köftesi, ızgarada mühürlenip eriyen kaşar ve taze garnitürlerle yumuşacık ekmekte sunulur.",
    "Tavuk Burger": "Marine edilmiş çıtır tavuk göğsü, taze marul, domates ve özel sosumuzla hazırlanır; yanında altın sarısı patates kızartmasıyla.",
    "Karışık Izgara": "Dana bonfile, kasap köfte ve tavuk pirzolanın mangal ateşinde buluştuğu; pilav ve közlenmiş garnitürlerle taçlanan bir ziyafet.",
    "Pizza Çeşitleri": "İnce açılmış hamurun taş fırında çıtırlaştığı; margaritadan kavurmalıya, bol mozzarellalı dört farklı usta işi pizza seçeneği.",
    "İçli Köfte": "İncecik bulgur kabuğunun içinde cevizli ve baharatlı kıyma harcı; dışı çıtır, içi yumuşacık geleneksel bir Anadolu klasiği.",
    "Çorba Çeşitleri": "Günlük taze malzemelerle pişirilen mercimek ve mevsim çorbaları; kızdırılmış tereyağlı sos ve kıtır ekmek eşliğinde sunulur.",
    "Patates Kızartması": "Özenle seçilen patateslerin çifte kızartma tekniğiyle hazırlanan; dışı altın sarısı çıtır, içi pamuk gibi yumuşak hali.",
    "Tost Çeşitleri": "Bol kaşarlı, sucuklu ve karışık seçenekleriyle bastırma usulü kızartılan; dışı çıtır, içi sımsıcak akışkan efsane tostlar.",
    "Sucuklu Yumurta": "Gerçek kasap sucuğunun tereyağında yavaşça kavrulup köy yumurtasıyla buluştuğu; sahanda cazırdayarak gelen kahvaltı klasiği.",
    "Salata Çeşitleri": "Günlük yıkanan çıtır yeşilliklerin ton balığı, beyaz peynir veya mevsim sebzeleriyle harmanlandığı zeytinyağlı tazelik.",
    "Serpme Kahvaltı": "Yöresel peynirler, ev reçelleri, sahanda sıcaklar ve taze ekmeklerle donatılan; demli çay eşliğinde uzayan keyifli bir sofra.",
    "Waffle": "Sıcacık waffle hamurunun Belçika çikolatası, taze muz, çilek ve kivi ile taçlandığı; her ısırıkta çıtırdayan bir mutluluk.",
    "Künefe": "Antep fıstığıyla süslenen tel kadayıfın içinde uzayan özel künefe peyniri; şerbetiyle sıcak sıcak servis edilen bir şölen.",
    "Katmer": "İncecik açılan yufkanın kaymak ve Antep fıstığıyla sarılıp çıtır çıtır pişirildiği; Gaziantep usulü zarif bir tatlı deneyimi.",
    "Sufle": "Dışı hafifçe kabarmış sıcak kekin kalbinden akan yoğun Belçika çikolatası; yanında bir top vanilyalı dondurmayla sunulur.",
    "Sütlaç": "Taş fırında üzeri karamelize olana dek pişirilen; tam kıvamındaki sütlü pirincin fındıkla buluştuğu geleneksel lezzet.",
    "Trileçe": "Üç farklı sütle ıslatılan pamuk dokulu kekin üzerinde parlak karamel örtüsü; hafif, serin ve tam kararında bir tatlı.",
    "Milkshake Çeşitleri": "Günlük süt ve gerçek meyvelerin dondurmayla çırpıldığı yoğun kıvamlı serinlik; çilek, muz, kavun ve çikolata seçenekleriyle.",
    "Frozen Çeşitleri": "Buzla inceltilen taze meyve püresinin en ferahlatan hali; kivi, çilek ve kavun seçenekleriyle bardağa sığan yaz serinliği.",
    "Buzlu Kahve Çeşitleri": "Yoğun espressonun soğuk süt ve buzla dengelendiği; karamel ve vanilya dokunuşlarıyla ferahlatan buzlu kahve klasikleri.",
    "Taze Meyve Suları": "Sipariş anında soğuk sıkım hazırlanan portakal, elma ve havuç suları; katkısız, vitamin dolu ve buz gibi bir tazelik.",
    "Atom & Limonata": "Nar suyu, atom ve ev yapımı nane-limon ferahlığının buz gibi servis edildiği; güne enerji katan doğal içecek üçlüsü.",
    "Kutu İçecekler": "Buz gibi servis edilen gazlı ve meyveli kutu içecekler; cola, gazoz, soğuk çay ve meyve nektarı çeşitleriyle her damağa.",
    "Türk Kahvesi": "Kısık ateşte bakır cezvede bol köpüklü pişirilen; yanında lokum ve suyla sunulan beş asırlık geleneksel kahve ritüeli.",
    "Espresso": "Seçili yöre çekirdeklerinin ideal basınçla demlendiği; yoğun kremalı, dengeli asiditeli, kısa ama güçlü bir kahve yudumu.",
    "Latte": "İpeksi buharlanmış sütün taze çekilmiş espressoyla kucaklaştığı; üzeri latte art ile süslenen yumuşak içimli bir klasik.",
    "Cappuccino": "Eşit ölçüde espresso, sıcak süt ve kadifemsi süt köpüğünün buluştuğu; üzerine tarçın dokunuşuyla gelen İtalyan zarafeti.",
    "Americano": "Double espressonun sıcak suyla açılarak filtre yumuşaklığına kavuştuğu; gün boyu keyifle içilen dengeli kahve deneyimi.",
    "Filtre Kahve": "Taze öğütülmüş çekirdeklerin damla damla demlendiği; meyvemsi notaları belirgin, bol ve rahat içimli kocaman bir fincan.",
    "Çay Çeşitleri": "İnce belli bardakta demli Rize çayı ve şifalı bitki çayları; ıhlamur, ada çayı, kuşburnu ve nane-limon seçenekleriyle.",
    "Salep": "Sıcak sütle kıvam bulan gerçek salep kökünün üzerine bolca tarçın; kış günlerinde içinizi ısıtan nostaljik bir dost.",
    "Sıcak Çikolata": "Eritilmiş gerçek çikolatanın sıcak sütle yoğunlaştığı; üzeri kremayla taçlanan kadifemsi ve sımsıcak bir kış klasiği.",
}


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]
    updated = 0
    for name, desc in DESCS.items():
        r = await db.menu_items.update_one({"name": name}, {"$set": {"description": desc}})
        updated += r.modified_count
        if r.matched_count == 0:
            print("NOT FOUND:", name)
    print("updated:", updated)
    client.close()

asyncio.run(main())
