/* PizzaScan universal language layer.
 *
 * The original UI catalogue contains German source keys and complete
 * de/en/it/es/fr copies.  This late layer keeps those translations intact,
 * adds browser-language negotiation for further locales, and uses the
 * catalogue's English copy as a deliberate last-resort translation rather
 * than exposing German text in an additional locale.  All generated DOM is
 * observed, so settings, sheets, loading states and status messages follow
 * the same language choice after the initial page has rendered.
 */
(function(root){
 'use strict';

 const KEY='pizzascan-language-v1';
 const BASE=['de','en','it','es','fr'];
 const EXTRA=['pt','nl','pl','tr','ru','ja','zh','ko','ar'];
 const supported=[...BASE,...EXTRA];
 const names={
  de:'Deutsch',en:'English',it:'Italiano',es:'Español',fr:'Français',
  pt:'Português',nl:'Nederlands',pl:'Polski',tr:'Türkçe',ru:'Русский',
  ja:'日本語',zh:'中文',ko:'한국어',ar:'العربية'
 };
 const rtl=new Set(['ar']);
 const baseApi=root.PizzaI18n||{};
 const catalog=baseApi.catalog||{};
 const baseTranslate=typeof baseApi.translate==='function'?baseApi.translate:(value=>value);

 // High-frequency controls and status copy is native in the additional
 // locales.  The larger existing catalogue supplies the long-tail English
 // copy until a locale-specific copy is needed, so every view has a stable
 // non-German rendering from day one.
 const core=Object.create(null);
 const add=(de,copies)=>{core[de]=copies;};
 add('SPRACHE',{pt:'IDIOMA',nl:'TAAL',pl:'JĘZYK',tr:'DİL',ru:'ЯЗЫК',ja:'言語',zh:'语言',ko:'언어',ar:'اللغة'});
 add('App-Sprache',{pt:'Idioma da aplicação',nl:'App-taal',pl:'Język aplikacji',tr:'Uygulama dili',ru:'Язык приложения',ja:'アプリの言語',zh:'应用语言',ko:'앱 언어',ar:'لغة التطبيق'});
 add('Automatisch wurde die Gerätesprache verwendet. Du kannst sie hier jederzeit ändern.',{pt:'O idioma do dispositivo foi selecionado automaticamente. Pode alterá-lo aqui a qualquer momento.',nl:'De apparaattaal is automatisch gekozen. Je kunt die hier altijd wijzigen.',pl:'Język urządzenia został wybrany automatycznie. Możesz go tutaj w każdej chwili zmienić.',tr:'Cihaz dili otomatik olarak seçildi. Buradan istediğiniz zaman değiştirebilirsiniz.',ru:'Язык устройства выбран автоматически. Здесь его можно изменить в любое время.',ja:'端末の言語が自動的に選択されました。ここでいつでも変更できます。',zh:'已自动选择设备语言。你可以随时在这里更改。',ko:'기기 언어가 자동으로 선택되었습니다. 여기에서 언제든지 변경할 수 있습니다.',ar:'تم اختيار لغة الجهاز تلقائيًا. يمكنك تغييرها هنا في أي وقت.'});
 add('Einstellungen',{pt:'Definições',nl:'Instellingen',pl:'Ustawienia',tr:'Ayarlar',ru:'Настройки',ja:'設定',zh:'设置',ko:'설정',ar:'الإعدادات'});
 add('Schließen',{pt:'Fechar',nl:'Sluiten',pl:'Zamknij',tr:'Kapat',ru:'Закрыть',ja:'閉じる',zh:'关闭',ko:'닫기',ar:'إغلاق'});
 add('Karte',{pt:'Mapa',nl:'Kaart',pl:'Mapa',tr:'Harita',ru:'Карта',ja:'地図',zh:'地图',ko:'지도',ar:'الخريطة'});
 add('Fotobewertung',{pt:'Análise de foto',nl:'Fotoanalyse',pl:'Analiza zdjęcia',tr:'Foto analizi',ru:'Анализ фото',ja:'写真分析',zh:'照片分析',ko:'사진 분석',ar:'تحليل الصورة'});
 add('Suchen',{pt:'Pesquisar',nl:'Zoeken',pl:'Szukaj',tr:'Ara',ru:'Поиск',ja:'検索',zh:'搜索',ko:'검색',ar:'بحث'});
 add('Suche minimieren',{pt:'Minimizar pesquisa',nl:'Zoekveld verkleinen',pl:'Minimalizuj wyszukiwanie',tr:'Aramayı küçült',ru:'Свернуть поиск',ja:'検索を縮小',zh:'收起搜索',ko:'검색 최소화',ar:'تصغير البحث'});
 add('Suchtreffer',{pt:'Resultados da pesquisa',nl:'Zoekresultaten',pl:'Wyniki wyszukiwania',tr:'Arama sonuçları',ru:'Результаты поиска',ja:'検索結果',zh:'搜索结果',ko:'검색 결과',ar:'نتائج البحث'});
 add('Filter',{pt:'Filtros',nl:'Filters',pl:'Filtry',tr:'Filtreler',ru:'Фильтры',ja:'フィルター',zh:'筛选',ko:'필터',ar:'الفلاتر'});
 add('◷ Jetzt geöffnet',{pt:'◷ Aberto agora',nl:'◷ Nu open',pl:'◷ Teraz otwarte',tr:'◷ Şimdi açık',ru:'◷ Открыто сейчас',ja:'◷ 営業中',zh:'◷ 当前营业',ko:'◷ 지금 영업 중',ar:'◷ مفتوح الآن'});
 add('🟢 Nur geöffnet',{pt:'🟢 Apenas abertos',nl:'🟢 Alleen open',pl:'🟢 Tylko otwarte',tr:'🟢 Yalnızca açık',ru:'🟢 Только открытые',ja:'🟢 営業中のみ',zh:'🟢 仅显示营业中',ko:'🟢 영업 중만',ar:'🟢 المفتوح فقط'});
 add('Vollbild',{pt:'Ecrã inteiro',nl:'Volledig scherm',pl:'Pełny ekran',tr:'Tam ekran',ru:'Полный экран',ja:'全画面',zh:'全屏',ko:'전체 화면',ar:'ملء الشاشة'});
 add('← Zurück',{pt:'← Voltar',nl:'← Terug',pl:'← Wstecz',tr:'← Geri',ru:'← Назад',ja:'← 戻る',zh:'← 返回',ko:'← 뒤로',ar:'← رجوع'});
 add('Hier suchen',{pt:'Pesquisar aqui',nl:'Hier zoeken',pl:'Szukaj tutaj',tr:'Burada ara',ru:'Искать здесь',ja:'ここを検索',zh:'在此搜索',ko:'여기 검색',ar:'البحث هنا'});
 add('Karte wird geladen …',{pt:'A carregar o mapa …',nl:'Kaart laden …',pl:'Wczytywanie mapy …',tr:'Harita yükleniyor …',ru:'Загрузка карты …',ja:'地図を読み込み中 …',zh:'正在加载地图 …',ko:'지도 로드 중 …',ar:'جارٍ تحميل الخريطة …'});
 add('Restaurant oder Pizza-Ort suchen',{pt:'Pesquisar restaurante ou pizzaria',nl:'Restaurant of pizzazaak zoeken',pl:'Szukaj restauracji lub pizzerii',tr:'Restoran veya pizza yeri ara',ru:'Найти ресторан или пиццерию',ja:'レストランまたはピザ店を検索',zh:'搜索餐厅或披萨店',ko:'레스토랑 또는 피자 가게 검색',ar:'البحث عن مطعم أو مكان بيتزا'});
 add('Pizzeria, Ristorante, Trattoria, Pizza-Bar …',{pt:'Pizzaria, restaurante italiano, trattoria, bar de pizza …',nl:'Pizzeria, Italiaans restaurant, trattoria, pizzabar …',pl:'Pizzeria, restauracja włoska, trattoria, bar z pizzą …',tr:'Pizzacı, İtalyan restoranı, trattoria, pizza barı …',ru:'Пиццерия, итальянский ресторан, траттория, пицца-бар …',ja:'ピッツェリア、イタリアン、トラットリア、ピザバー …',zh:'披萨店、意大利餐厅、餐馆、披萨酒吧 …',ko:'피자리아, 이탈리아 레스토랑, 트라토리아, 피자 바 …',ar:'بيتزا، مطعم إيطالي، تراتوريا، بار بيتزا …'});
 add('Pizzeria, italienisches Restaurant, Stadt oder Adresse suchen',{pt:'Pesquisar pizzaria, restaurante italiano, cidade ou endereço',nl:'Pizzeria, Italiaans restaurant, stad of adres zoeken',pl:'Szukaj pizzerii, włoskiej restauracji, miasta lub adresu',tr:'Pizzacı, İtalyan restoranı, şehir veya adres ara',ru:'Найти пиццерию, итальянский ресторан, город или адрес',ja:'ピッツェリア、イタリアン、都市、住所を検索',zh:'搜索披萨店、意大利餐厅、城市或地址',ko:'피자리아, 이탈리아 레스토랑, 도시 또는 주소 검색',ar:'البحث عن بيتزا أو مطعم إيطالي أو مدينة أو عنوان'});
 add('DEIN NÄCHSTER LIEBLINGSPLATZ',{pt:'O SEU PRÓXIMO LUGAR FAVORITO',nl:'JOUW VOLGENDE FAVORIETE PLEK',pl:'TWOJE NASTĘPNE ULUBIONE MIEJSCE',tr:'SIRADAKİ FAVORİ MEKANIN',ru:'ТВОЁ СЛЕДУЮЩЕЕ ЛЮБИМОЕ МЕСТО',ja:'次のお気に入りの場所',zh:'你的下一个心仪去处',ko:'다음 최애 장소',ar:'مكانك المفضل القادم'});
 add('Gute Pizza. Ganz nah.',{pt:'Boa pizza. Mesmo aqui.',nl:'Goede pizza. Vlakbij.',pl:'Dobra pizza. Tuż obok.',tr:'İyi pizza. Hemen yakında.',ru:'Отличная пицца. Совсем рядом.',ja:'おいしいピザ。すぐ近く。',zh:'好披萨，就在附近。',ko:'맛있는 피자. 바로 근처에.',ar:'بيتزا جيدة. قريبة جدًا.'});
 add('Meine Rezensionsentwürfe',{pt:'Os meus rascunhos de avaliações',nl:'Mijn reviewconcepten',pl:'Moje szkice recenzji',tr:'İnceleme taslaklarım',ru:'Мои черновики отзывов',ja:'レビュー下書き',zh:'我的评论草稿',ko:'내 리뷰 초안',ar:'مسودات مراجعاتي'});
 add('Pizza & Italienisch im Umkreis',{pt:'Pizza e cozinha italiana nas proximidades',nl:'Pizza en Italiaans eten in de buurt',pl:'Pizza i kuchnia włoska w pobliżu',tr:'Yakındaki pizza ve İtalyan yemekleri',ru:'Пицца и итальянская кухня поблизости',ja:'近くのピザとイタリア料理',zh:'附近的披萨和意大利餐厅',ko:'주변 피자 및 이탈리아 음식',ar:'البيتزا والمطاعم الإيطالية القريبة'});
 add('♡ Gemerkt',{pt:'♡ Guardados',nl:'♡ Opgeslagen',pl:'♡ Zapisane',tr:'♡ Kaydedilenler',ru:'♡ Сохранённые',ja:'♡ 保存済み',zh:'♡ 已收藏',ko:'♡ 저장됨',ar:'♡ المحفوظات'});
 add('Alle Orte',{pt:'Todos os locais',nl:'Alle plaatsen',pl:'Wszystkie miejsca',tr:'Tüm yerler',ru:'Все места',ja:'すべての場所',zh:'所有地点',ko:'모든 장소',ar:'كل الأماكن'});
 add('Details',{pt:'Detalhes',nl:'Details',pl:'Szczegóły',tr:'Ayrıntılar',ru:'Подробности',ja:'詳細',zh:'详情',ko:'세부 정보',ar:'التفاصيل'});
 add('Rezension',{pt:'Avaliação',nl:'Review',pl:'Recenzja',tr:'İnceleme',ru:'Отзыв',ja:'レビュー',zh:'评论',ko:'리뷰',ar:'مراجعة'});
 add('Route',{pt:'Rota',nl:'Route',pl:'Trasa',tr:'Rota',ru:'Маршрут',ja:'ルート',zh:'路线',ko:'경로',ar:'المسار'});
 add('Pizza bewerten',{pt:'Avaliar pizza',nl:'Pizza beoordelen',pl:'Oceń pizzę',tr:'Pizzayı değerlendir',ru:'Оценить пиццу',ja:'ピザを評価',zh:'评价披萨',ko:'피자 평가',ar:'قيّم البيتزا'});
 add('♡ Merken',{pt:'♡ Guardar',nl:'♡ Opslaan',pl:'♡ Zapisz',tr:'♡ Kaydet',ru:'♡ Сохранить',ja:'♡ 保存',zh:'♡ 收藏',ko:'♡ 저장',ar:'♡ حفظ'});
 add('♥ Gemerkt',{pt:'♥ Guardado',nl:'♥ Opgeslagen',pl:'♥ Zapisano',tr:'♥ Kaydedildi',ru:'♥ Сохранено',ja:'♥ 保存済み',zh:'♥ 已收藏',ko:'♥ 저장됨',ar:'♥ محفوظ'});
 add('Öffnungszeiten',{pt:'Horário de funcionamento',nl:'Openingstijden',pl:'Godziny otwarcia',tr:'Çalışma saatleri',ru:'Часы работы',ja:'営業時間',zh:'营业时间',ko:'영업시간',ar:'ساعات العمل'});
 add('Anrufen',{pt:'Ligar',nl:'Bellen',pl:'Zadzwoń',tr:'Ara',ru:'Позвонить',ja:'電話',zh:'拨打电话',ko:'전화',ar:'اتصال'});
 add('Website',{pt:'Site',nl:'Website',pl:'Strona internetowa',tr:'Web sitesi',ru:'Сайт',ja:'ウェブサイト',zh:'网站',ko:'웹사이트',ar:'الموقع الإلكتروني'});
 add('Speisekarte',{pt:'Menu',nl:'Menu',pl:'Menu',tr:'Menü',ru:'Меню',ja:'メニュー',zh:'菜单',ko:'메뉴',ar:'قائمة الطعام'});
 add('Deine Fotoanalysen',{pt:'As suas análises de fotos',nl:'Jouw fotoanalyses',pl:'Twoje analizy zdjęć',tr:'Foto analizlerin',ru:'Ваши анализы фото',ja:'写真分析',zh:'你的照片分析',ko:'사진 분석',ar:'تحليلات الصور'});
 add('Pizza fotografieren',{pt:'Fotografar pizza',nl:'Pizza fotograferen',pl:'Zrób zdjęcie pizzy',tr:'Pizza fotoğrafı çek',ru:'Сфотографировать пиццу',ja:'ピザを撮影',zh:'拍摄披萨照片',ko:'피자 촬영',ar:'تصوير البيتزا'});
 add('Kamera öffnen oder Foto auswählen',{pt:'Abrir a câmara ou escolher uma foto',nl:'Camera openen of foto kiezen',pl:'Otwórz aparat lub wybierz zdjęcie',tr:'Kamerayı aç veya fotoğraf seç',ru:'Открыть камеру или выбрать фото',ja:'カメラを開くか写真を選択',zh:'打开相机或选择照片',ko:'카메라 열기 또는 사진 선택',ar:'فتح الكاميرا أو اختيار صورة'});
 add('Abbrechen',{pt:'Cancelar',nl:'Annuleren',pl:'Anuluj',tr:'İptal',ru:'Отмена',ja:'キャンセル',zh:'取消',ko:'취소',ar:'إلغاء'});
 add('Speichern',{pt:'Guardar',nl:'Opslaan',pl:'Zapisz',tr:'Kaydet',ru:'Сохранить',ja:'保存',zh:'保存',ko:'저장',ar:'حفظ'});
 add('Löschen',{pt:'Eliminar',nl:'Verwijderen',pl:'Usuń',tr:'Sil',ru:'Удалить',ja:'削除',zh:'删除',ko:'삭제',ar:'حذف'});
 add('Exportieren',{pt:'Exportar',nl:'Exporteren',pl:'Eksportuj',tr:'Dışa aktar',ru:'Экспортировать',ja:'エクスポート',zh:'导出',ko:'내보내기',ar:'تصدير'});
 add('Importieren',{pt:'Importar',nl:'Importeren',pl:'Importuj',tr:'İçe aktar',ru:'Импортировать',ja:'インポート',zh:'导入',ko:'가져오기',ar:'استيراد'});
 add('Bewertungen',{pt:'Avaliações',nl:'Beoordelingen',pl:'Oceny',tr:'Değerlendirmeler',ru:'Оценки',ja:'評価',zh:'评分',ko:'평가',ar:'التقييمات'});
 add('Bewertung konnte nicht gespeichert werden.',{pt:'Não foi possível guardar a avaliação.',nl:'De beoordeling kon niet worden opgeslagen.',pl:'Nie udało się zapisać oceny.',tr:'Değerlendirme kaydedilemedi.',ru:'Не удалось сохранить оценку.',ja:'評価を保存できませんでした。',zh:'无法保存评分。',ko:'평가를 저장하지 못했습니다.',ar:'تعذر حفظ التقييم.'});
 add('Bewertung und Rezension verwenden jetzt denselben Wert.',{pt:'A avaliação e a crítica usam agora o mesmo valor.',nl:'Beoordeling en review gebruiken nu dezelfde waarde.',pl:'Ocena i recenzja używają teraz tej samej wartości.',tr:'Değerlendirme ve inceleme artık aynı değeri kullanıyor.',ru:'Оценка и отзыв теперь используют одно и то же значение.',ja:'評価とレビューで同じ値を使うようになりました。',zh:'评分和评论现在使用相同的数值。',ko:'평가와 리뷰가 이제 같은 값을 사용합니다.',ar:'يستخدم التقييم والمراجعة الآن القيمة نفسها.'});
 add('Bitte eine Bewertung von 0,1 bis 10,0 eingeben.',{pt:'Introduza uma avaliação entre 0,1 e 10,0.',nl:'Voer een beoordeling van 0,1 tot 10,0 in.',pl:'Wpisz ocenę od 0,1 do 10,0.',tr:'0,1 ile 10,0 arasında bir değerlendirme girin.',ru:'Введите оценку от 0,1 до 10,0.',ja:'0.1〜10.0の評価を入力してください。',zh:'请输入 0.1 到 10.0 之间的评分。',ko:'0.1에서 10.0 사이의 평가를 입력하세요.',ar:'أدخل تقييمًا بين 0.1 و10.0.'});
 add('Modell wird geladen …',{pt:'A carregar o modelo …',nl:'Model laden …',pl:'Wczytywanie modelu …',tr:'Model yükleniyor …',ru:'Загрузка модели …',ja:'モデルを読み込み中 …',zh:'正在加载模型 …',ko:'모델 로드 중 …',ar:'جارٍ تحميل النموذج …'});
 add('Modell einsatzbereit. Das Foto kann jetzt offline analysiert werden.',{pt:'Modelo pronto. A foto pode agora ser analisada offline.',nl:'Model klaar. De foto kan nu offline worden geanalyseerd.',pl:'Model gotowy. Zdjęcie można teraz analizować offline.',tr:'Model hazır. Fotoğraf artık çevrimdışı analiz edilebilir.',ru:'Модель готова. Теперь фото можно анализировать офлайн.',ja:'モデルの準備が完了しました。写真をオフラインで分析できます。',zh:'模型已准备就绪。现在可以离线分析照片。',ko:'모델이 준비되었습니다. 이제 오프라인으로 사진을 분석할 수 있습니다.',ar:'النموذج جاهز. يمكن الآن تحليل الصورة دون اتصال.'});
 add('Standort wird ermittelt …',{pt:'A obter localização …',nl:'Locatie bepalen …',pl:'Ustalanie lokalizacji …',tr:'Konum alınıyor …',ru:'Определение местоположения …',ja:'位置情報を取得中 …',zh:'正在获取位置 …',ko:'위치 확인 중 …',ar:'جارٍ تحديد الموقع …'});
 add('GPS-Standort konnte nicht ermittelt werden.',{pt:'Não foi possível obter a localização GPS.',nl:'De GPS-locatie kon niet worden bepaald.',pl:'Nie udało się ustalić lokalizacji GPS.',tr:'GPS konumu alınamadı.',ru:'Не удалось определить местоположение GPS.',ja:'GPS位置を取得できませんでした。',zh:'无法获取 GPS 位置。',ko:'GPS 위치를 확인하지 못했습니다.',ar:'تعذر تحديد موقع GPS.'});
 add('Keine Ergebnisse für „',{pt:'Sem resultados para „',nl:'Geen resultaten voor “',pl:'Brak wyników dla „',tr:'Şu ifade için sonuç yok: “',ru:'Нет результатов для «',ja:'「',zh:'“',ko:'“',ar:'لا توجد نتائج لـ «'});
 add('Weitere passende Pizza-Orte werden ergänzt …',{pt:'Estão a ser adicionados mais locais de pizza …',nl:'Meer passende pizzazaken worden toegevoegd …',pl:'Dodawanie kolejnych pasujących pizzerii …',tr:'Daha fazla uygun pizza yeri ekleniyor …',ru:'Добавляются другие подходящие пиццерии …',ja:'一致するピザ店を追加中 …',zh:'正在补充更多匹配的披萨地点 …',ko:'일치하는 피자 장소를 더 추가하는 중 …',ar:'جارٍ إضافة المزيد من أماكن البيتزا المطابقة …'});
 add('Zusätzliche Pizza- und Italien-Orte werden gesucht …',{pt:'A procurar mais locais de pizza e comida italiana …',nl:'Meer pizza- en Italiaanse locaties zoeken …',pl:'Wyszukiwanie dodatkowych pizzerii i miejsc włoskich …',tr:'Ek pizza ve İtalyan mekanları aranıyor …',ru:'Поиск дополнительных пиццерий и итальянских заведений …',ja:'追加のピザ・イタリア料理店を検索中 …',zh:'正在搜索更多披萨和意大利餐厅 …',ko:'추가 피자 및 이탈리아 음식점을 검색하는 중 …',ar:'جارٍ البحث عن أماكن بيتزا وإيطالية إضافية …'});

 const dynamic={
  en:[[/^(\d+) von (\d+) Orten$/,'$1 of $2 places'],[/^(\d+) Pizza-Orte$/,'$1 pizza places'],[/^Pizza im Umkreis · (.+)$/,'Pizza nearby · $1'],[/^Aktualisiert (.+)$/,'Updated $1'],[/^Suche „(.+)“ …$/,'Searching “$1” …'],[/^Keine Ergebnisse für „(.+)“\.$/,'No results for “$1”.'],[/^(\d+) relevante Treffer · OpenStreetMap$/,'$1 relevant places · OpenStreetMap']],
  pt:[[/^(\d+) von (\d+) Orten$/,'$1 de $2 locais'],[/^(\d+) Pizza-Orte$/,'$1 locais de pizza'],[/^Pizza im Umkreis · (.+)$/,'Pizza perto · $1'],[/^Aktualisiert (.+)$/,'Atualizado $1'],[/^Suche „(.+)“ …$/,'A pesquisar “$1” …'],[/^Keine Ergebnisse für „(.+)“\.$/,'Sem resultados para “$1”.'],[/^(\d+) relevante Treffer · OpenStreetMap$/,'$1 locais relevantes · OpenStreetMap']],
  nl:[[/^(\d+) von (\d+) Orten$/,'$1 van $2 plaatsen'],[/^(\d+) Pizza-Orte$/,'$1 pizzazaken'],[/^Pizza im Umkreis · (.+)$/,'Pizza in de buurt · $1'],[/^Aktualisiert (.+)$/,'Bijgewerkt $1'],[/^Suche „(.+)“ …$/,'Zoeken naar “$1” …'],[/^Keine Ergebnisse für „(.+)“\.$/,'Geen resultaten voor “$1”.'],[/^(\d+) relevante Treffer · OpenStreetMap$/,'$1 relevante plaatsen · OpenStreetMap']],
  pl:[[/^(\d+) von (\d+) Orten$/,'$1 z $2 miejsc'],[/^(\d+) Pizza-Orte$/,'$1 pizzerii'],[/^Pizza im Umkreis · (.+)$/,'Pizza w pobliżu · $1'],[/^Aktualisiert (.+)$/,'Zaktualizowano $1'],[/^Suche „(.+)“ …$/,'Wyszukiwanie „$1” …'],[/^Keine Ergebnisse für „(.+)“\.$/,'Brak wyników dla „$1”.'],[/^(\d+) relevante Treffer · OpenStreetMap$/,'$1 istotnych miejsc · OpenStreetMap']],
  tr:[[/^(\d+) von (\d+) Orten$/,'$1 / $2 mekan'],[/^(\d+) Pizza-Orte$/,'$1 pizza mekanı'],[/^Pizza im Umkreis · (.+)$/,'Yakındaki pizza · $1'],[/^Aktualisiert (.+)$/,'Güncellendi $1'],[/^Suche „(.+)“ …$/,'“$1” aranıyor …'],[/^Keine Ergebnisse für „(.+)“\.$/,'“$1” için sonuç yok.'],[/^(\d+) relevante Treffer · OpenStreetMap$/,'$1 ilgili mekan · OpenStreetMap']],
  ru:[[/^(\d+) von (\d+) Orten$/,'$1 из $2 мест'],[/^(\d+) Pizza-Orte$/,'$1 пиццерий'],[/^Pizza im Umkreis · (.+)$/,'Пицца поблизости · $1'],[/^Aktualisiert (.+)$/,'Обновлено $1'],[/^Suche „(.+)“ …$/,'Поиск «$1» …'],[/^Keine Ergebnisse für „(.+)“\.$/,'Нет результатов для «$1».'],[/^(\d+) relevante Treffer · OpenStreetMap$/,'$1 подходящих мест · OpenStreetMap']],
  ja:[[/^(\d+) von (\d+) Orten$/,'$2件中$1件'],[/^(\d+) Pizza-Orte$/,'ピザ店 $1件'],[/^Pizza im Umkreis · (.+)$/,'近くのピザ · $1'],[/^Aktualisiert (.+)$/,'更新: $1'],[/^Suche „(.+)“ …$/,'「$1」を検索中 …'],[/^Keine Ergebnisse für „(.+)“\.$/,'「$1」の結果はありません。'],[/^(\d+) relevante Treffer · OpenStreetMap$/,'関連する場所 $1件 · OpenStreetMap']],
  zh:[[/^(\d+) von (\d+) Orten$/,'$2 个地点中的 $1 个'],[/^(\d+) Pizza-Orte$/,'$1 个披萨地点'],[/^Pizza im Umkreis · (.+)$/,'附近披萨 · $1'],[/^Aktualisiert (.+)$/,'已更新 $1'],[/^Suche „(.+)“ …$/,'正在搜索“$1” …'],[/^Keine Ergebnisse für „(.+)“\.$/,'没有“$1”的结果。'],[/^(\d+) relevante Treffer · OpenStreetMap$/,'$1 个相关地点 · OpenStreetMap']],
  ko:[[/^(\d+) von (\d+) Orten$/,'$2개 중 $1개 장소'],[/^(\d+) Pizza-Orte$/,'피자 장소 $1개'],[/^Pizza im Umkreis · (.+)$/,'주변 피자 · $1'],[/^Aktualisiert (.+)$/,'업데이트됨 $1'],[/^Suche „(.+)“ …$/,'“$1” 검색 중 …'],[/^Keine Ergebnisse für „(.+)“\.$/,'“$1” 결과가 없습니다.'],[/^(\d+) relevante Treffer · OpenStreetMap$/,'관련 장소 $1개 · OpenStreetMap']],
  ar:[[/^(\d+) von (\d+) Orten$/,'$1 من $2 أماكن'],[/^(\d+) Pizza-Orte$/,'$1 أماكن بيتزا'],[/^Pizza im Umkreis · (.+)$/,'بيتزا قريبة · $1'],[/^Aktualisiert (.+)$/,'تم التحديث $1'],[/^Suche „(.+)“ …$/,'جارٍ البحث عن «$1» …'],[/^Keine Ergebnisse für „(.+)“\.$/,'لا توجد نتائج لـ «$1».'],[/^(\d+) relevante Treffer · OpenStreetMap$/,'$1 أماكن ذات صلة · OpenStreetMap']]
 };

 function safeStorageGet(){try{return root.localStorage?.getItem(KEY)||'';}catch{return '';}}
 function safeStorageSet(value){try{root.localStorage?.setItem(KEY,value);}catch{}}
 function normalize(value){const raw=String(value||'').trim().toLowerCase().replace('_','-');if(!raw)return '';const base=raw.split('-')[0];return supported.includes(raw)?raw:(supported.includes(base)?base:'');}
 function detect(){const list=[];try{if(Array.isArray(root.navigator?.languages))list.push(...root.navigator.languages);}catch{}try{list.push(root.navigator?.language||'');}catch{}for(const value of list){const code=normalize(value);if(code)return code;}return 'de';}
 function storedOrDetected(){const stored=normalize(safeStorageGet());return stored||detect();}
 let active=storedOrDetected();
 function isBase(code){return BASE.includes(code);}
 function applyDocument(){const doc=root.document;if(!doc)return;doc.documentElement.lang=active;doc.documentElement.dir=rtl.has(active)?'rtl':'ltr';doc.documentElement.dataset.language=active;}
 function fallback(source){return catalog[source]?.en||source;}
 function translate(source){
  const value=String(source??'');if(!value||active==='de')return value;
  if(isBase(active))return baseTranslate(value);
  const direct=core[value]?.[active];if(direct)return direct;
  const rows=dynamic[active]||[];for(const [re,repl] of rows)if(re.test(value))return value.replace(re,repl);
  const focus=value.match(/^Schwerpunkt (.+)$/);if(focus){const prefix={pt:'Foco ',nl:'Focus ',pl:'Obszar ',tr:'Odak ',ru:'Фокус: ',ja:'重点: ',zh:'重点：',ko:'초점: ',ar:'التركيز: '}[active]||'Focus ';return prefix+translate(focus[1]);}
  if(value.includes(' · '))return value.split(' · ').map(translate).join(' · ');
  return fallback(value);
 }
 function localizedOptions(select){if(!select)return;const value=select.value||active;select.innerHTML=supported.map(code=>`<option value="${code}">${names[code]}</option>`).join('');select.value=supported.includes(value)?value:active;select.onchange=event=>setLanguage(event.target.value);}
 function setLanguage(code){const next=normalize(code);if(!next)return false;active=next;safeStorageSet(next);applyDocument();try{root.PizzaScanNative?.postMessage?.(JSON.stringify({type:'setLanguage',language:next}));}catch{}refreshControls();if(root.location?.reload)root.location.reload();return true;}
 function refreshControls(){
  const doc=root.document;if(!doc)return;
  for(const select of doc.querySelectorAll('#pizzascan-language-select,#welcome-language'))localizedOptions(select);
  const label=doc.querySelector('.welcome-language span');if(label)label.textContent=active==='de'?'Sprache / Language':translate('App-Sprache');
  const block=doc.getElementById('pizzascan-language-control');if(block){const eyebrow=block.querySelector('.eyebrow'),fieldLabel=block.querySelector('label'),hint=block.querySelector('.hint');if(eyebrow)eyebrow.textContent=translate('SPRACHE');if(fieldLabel)fieldLabel.textContent=translate('App-Sprache');if(hint)hint.textContent=translate('Automatisch wurde die Gerätesprache verwendet. Du kannst sie hier jederzeit ändern.');}
 }
 function dynamicAllowed(element){return element?.id==='ratings-status'||element?.id==='search-status'||element?.id==='history-stats'||element?.classList?.contains('venue-rating')||element?.classList?.contains('ratings-status');}
 function clearNoTranslateForStatus(){const doc=root.document;if(!doc)return;for(const element of doc.querySelectorAll('[translate="no"]'))if(dynamicAllowed(element))element.removeAttribute('translate');}
 function withEnglish(callback){const previous=root.PizzaI18n;const english={...previous,get language(){return 'en';}};root.PizzaI18n=english;try{return callback();}finally{root.PizzaI18n=previous;}}
 function installFeatureFallbacks(){
  if(isBase(active))return;
  if(root.PizzaReview?.generate&&!root.PizzaReview.generate.__universalExtra){const old=root.PizzaReview.generate;const wrapped=function(){return withEnglish(()=>old.apply(this,arguments));};wrapped.__universalExtra=true;root.PizzaReview.generate=wrapped;}
  if(root.PizzaModelInfo?.html&&!root.PizzaModelInfo.html.__universalExtra){const old=root.PizzaModelInfo.html;const wrapped=function(){return withEnglish(()=>old.apply(this,arguments));};wrapped.__universalExtra=true;root.PizzaModelInfo.html=wrapped;}
  if(typeof root.showPrivacy==='function'&&!root.showPrivacy.__universalExtra){const old=root.showPrivacy;const wrapped=function(){return withEnglish(()=>old.apply(this,arguments));};wrapped.__universalExtra=true;root.showPrivacy=wrapped;}
 }
 function skip(element){return !element||element.closest('script,style,textarea,code,[data-i18n-ignore]')||element.closest('[translate="no"]');}
 function translateNode(node){if(!node||skip(node.parentElement))return;const raw=node.nodeValue;if(!raw||!raw.trim())return;const lead=raw.match(/^\s*/)[0],tail=raw.match(/\s*$/)[0],body=raw.slice(lead.length,raw.length-tail.length),next=translate(body);if(next!==body)node.nodeValue=lead+next+tail;}
 function translateElement(element){if(!(element instanceof root.Element)||skip(element))return;for(const attr of ['aria-label','placeholder','title','alt']){const value=element.getAttribute(attr);if(value){const next=translate(value);if(next!==value)element.setAttribute(attr,next);}}for(const node of element.childNodes)if(node.nodeType===root.Node.TEXT_NODE)translateNode(node);}
 function translateTree(rootNode){const doc=root.document;if(!doc||!rootNode)return;clearNoTranslateForStatus();translateElement(rootNode);const walker=doc.createTreeWalker(rootNode,root.NodeFilter.SHOW_ELEMENT|root.NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){if(node.nodeType===root.Node.TEXT_NODE)translateNode(node);else translateElement(node);}}
 function install(){
  applyDocument();
  // Keep the public API compatible with the established five-language layer.
  if(Array.isArray(baseApi.supported))for(const code of EXTRA)if(!baseApi.supported.includes(code))baseApi.supported.push(code);
  if(baseApi.names)Object.assign(baseApi.names,names);
  root.PizzaI18n={get language(){return active;},get direction(){return rtl.has(active)?'rtl':'ltr';},supported,names,catalog,translate,setLanguage,detectLanguage:detect,refresh:()=>{refreshControls();if(!isBase(active))translateTree(docBody());},universal:true};
  root.PizzaLanguage={supported,names,detect,normalize,get language(){return active;},set:setLanguage,translate};
  installFeatureFallbacks();
  refreshControls();
  const body=docBody();if(!body)return;
  if(!isBase(active))translateTree(body);
  if(!body.__pizzaUniversalI18n){body.__pizzaUniversalI18n=true;let pending=false;new root.MutationObserver(()=>{if(pending)return;pending=true;root.setTimeout(()=>{pending=false;refreshControls();if(!isBase(active))translateTree(body);},0);}).observe(body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','title','alt','translate']});}
 }
 function docBody(){return root.document?.body||null;}
 if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})(typeof window!=='undefined'?window:globalThis);
