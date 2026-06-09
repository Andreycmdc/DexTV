import { CONFIG } from './config.js';

// ════════════════════════════════════════════════
// CACHÉ — 24 h
// ════════════════════════════════════════════════
const CACHE_KEY    = 'dextv_catalog_v7';
const CACHE_EXPIRY = CONFIG.CACHE_EXPIRY || 24 * 60 * 60 * 1000;

function setCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch (_) {}
}
function getCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const p = JSON.parse(raw);
        if (Date.now() - p.ts > CACHE_EXPIRY) { localStorage.removeItem(CACHE_KEY); return null; }
        return p.data;
    } catch (_) { return null; }
}

// ════════════════════════════════════════════════
// BASE LOCAL — 220 animes
// picture: null → se rellena por enrichWithJikan usando mal_id directo
// ════════════════════════════════════════════════
const LOCAL_DB = [
  // ── TOP / CLÁSICOS ──────────────────────────────────────────────────────────
  {malId:5114,  title:'Fullmetal Alchemist: Brotherhood',  type:'TV', eps:64,  year:2009, score:9.1, genres:['Action','Adventure','Fantasy','Drama'], synopsis:'Dos hermanos alquimistas buscan la Piedra Filosofal para recuperar sus cuerpos perdidos.'},
  {malId:9253,  title:'Steins;Gate',                        type:'TV', eps:24,  year:2011, score:9.1, genres:['Sci-Fi','Drama','Thriller'],             synopsis:'Un científico descubre cómo enviar mensajes al pasado y desencadena consecuencias catastróficas.'},
  {malId:11061, title:'Hunter x Hunter (2011)',             type:'TV', eps:148, year:2011, score:9.0, genres:['Action','Adventure','Fantasy'],          synopsis:'Gon abandona su isla natal para convertirse en Cazador y encontrar a su padre.'},
  {malId:16498, title:'Attack on Titan',                   type:'TV', eps:25,  year:2013, score:9.0, genres:['Action','Drama','Fantasy'],              synopsis:'La humanidad vive amurallada frente a gigantes devoradores llamados titanes.'},
  {malId:38524, title:'Shingeki no Kyojin Season 3 Part 2',type:'TV', eps:10,  year:2019, score:9.1, genres:['Action','Drama','Fantasy'],              synopsis:'La verdad detrás de los titanes y el mundo exterior finalmente se revela.'},
  {malId:41467, title:'Gintama: The Very Final',           type:'Movie',eps:1,  year:2021, score:9.0, genres:['Action','Comedy','Drama'],              synopsis:'El capítulo final de la épica historia de Gintoki y sus amigos.'},
  {malId:28977, title:'Gintama°',                          type:'TV', eps:51,  year:2015, score:9.1, genres:['Action','Comedy','Sci-Fi'],              synopsis:'Samurái desempleado trabaja como freelancer en un Japón invadido por extraterrestres.'},
  {malId:9969,  title:'Gintama\'',                         type:'TV', eps:51,  year:2011, score:9.0, genres:['Action','Comedy','Sci-Fi'],              synopsis:'Continúan las aventuras del excéntrico Gintoki y su agencia Yorozuya.'},
  {malId:2904,  title:'Code Geass',                        type:'TV', eps:25,  year:2006, score:8.7, genres:['Action','Mecha','Drama'],                synopsis:'Un exiliado real obtiene el poder de dar órdenes absolutas y lidera una revolución.'},
  {malId:19,    title:'Monster',                           type:'TV', eps:74,  year:2004, score:8.7, genres:['Drama','Mystery','Thriller'],            synopsis:'Un médico brillante persigue a un asesino en serie al que una vez salvó la vida.'},
  {malId:1535,  title:'Death Note',                        type:'TV', eps:37,  year:2006, score:8.6, genres:['Mystery','Drama','Supernatural'],        synopsis:'Un estudiante encuentra un cuaderno que mata a cualquiera cuyo nombre escriba en él.'},
  {malId:1575,  title:'Code Geass: Lelouch of the Rebellion R2', type:'TV', eps:25, year:2008, score:8.9, genres:['Action','Mecha','Drama'],           synopsis:'Lelouch continúa su lucha contra el Imperio Britanniano con Zero.'},
  {malId:33,    title:'Rurouni Kenshin: Trust & Betrayal', type:'OVA',eps:4,   year:1999, score:9.1, genres:['Action','Drama','Romance'],             synopsis:'El pasado oscuro de Kenshin como el asesino más temido de la era Bakumatsu.'},

  // ── ACCIÓN / SHONEN ─────────────────────────────────────────────────────────
  {malId:20,    title:'Naruto',                            type:'TV', eps:220, year:2002, score:7.9, genres:['Action','Adventure','Comedy'],          synopsis:'Un joven ninja con un demonio sellado en su interior sueña con ser el Hokage de su aldea.'},
  {malId:1735,  title:'Naruto: Shippuden',                 type:'TV', eps:500, year:2007, score:8.2, genres:['Action','Adventure','Fantasy'],         synopsis:'Naruto regresa más fuerte para salvar a su amigo Sasuke y proteger su mundo.'},
  {malId:21,    title:'One Piece',                         type:'TV', eps:1000,year:1999, score:8.7, genres:['Action','Adventure','Comedy','Fantasy'],synopsis:'Monkey D. Luffy y su tripulación buscan el legendario tesoro One Piece.'},
  {malId:269,   title:'Bleach',                            type:'TV', eps:366, year:2004, score:7.9, genres:['Action','Adventure','Supernatural'],    synopsis:'Ichigo Kurosaki obtiene los poderes de un Shinigami y defiende a los vivos de los Hollows.'},
  {malId:31240, title:'Re:Zero',                           type:'TV', eps:25,  year:2016, score:8.3, genres:['Fantasy','Drama','Thriller'],           synopsis:'Subaru es transportado a un mundo de fantasía donde muere y revive continuamente.'},
  {malId:40028, title:'Kimetsu no Yaiba',                  type:'TV', eps:26,  year:2019, score:8.7, genres:['Action','Fantasy','Drama'],             synopsis:'Tanjiro se convierte en cazador de demonios para salvar a su hermana convertida en demonio.'},
  {malId:41514, title:'Jujutsu Kaisen',                    type:'TV', eps:24,  year:2020, score:8.6, genres:['Action','Fantasy','Supernatural'],      synopsis:'Yuji Itadori ingiere una maldición y debe unirse a los hechiceros para destruirla.'},
  {malId:52991, title:'Sousou no Frieren',                 type:'TV', eps:28,  year:2023, score:9.0, genres:['Adventure','Fantasy','Drama'],          synopsis:'La maga Frieren viaja por el mundo reflexionando sobre el tiempo y los amigos perdidos.'},
  {malId:48569, title:'Jujutsu Kaisen 2nd Season',         type:'TV', eps:23,  year:2023, score:8.8, genres:['Action','Fantasy','Supernatural'],      synopsis:'El pasado de Gojo Satoru y la trágica historia del incidente de Shibuya.'},
  {malId:44511, title:'Chainsaw Man',                      type:'TV', eps:12,  year:2022, score:8.6, genres:['Action','Fantasy','Horror'],            synopsis:'Denji, un joven cazador de demonios, se fusiona con su perro demonio Pochita.'},
  {malId:50265, title:'Spy x Family',                      type:'TV', eps:25,  year:2022, score:8.5, genres:['Action','Comedy','Slice of Life'],      synopsis:'Un espía forma una familia falsa sin saber que todos ocultan sus propios secretos.'},
  {malId:37430, title:'Shingeki no Kyojin Season 3',       type:'TV', eps:12,  year:2018, score:8.7, genres:['Action','Drama','Fantasy'],             synopsis:'Eren y sus compañeros descubren secretos sobre la monarquía y los titanes.'},
  {malId:25777, title:'Akame ga Kill!',                    type:'TV', eps:24,  year:2014, score:7.5, genres:['Action','Adventure','Fantasy'],         synopsis:'Un joven aldeano se une a una organización de asesinos para combatir la corrupción del Imperio.'},
  {malId:11757, title:'Sword Art Online',                  type:'TV', eps:25,  year:2012, score:7.2, genres:['Action','Adventure','Fantasy','Romance'],synopsis:'Kirito queda atrapado en un videojuego de realidad virtual donde morir significa morir en la vida real.'},
  {malId:22319, title:'Tokyo Ghoul',                       type:'TV', eps:12,  year:2014, score:7.8, genres:['Action','Horror','Supernatural'],       synopsis:'Ken Kaneki se convierte en un ghoul mitad humano tras un encuentro casi fatal.'},
  {malId:10162, title:'Fairy Tail',                        type:'TV', eps:175, year:2009, score:7.6, genres:['Action','Adventure','Fantasy','Comedy'],synopsis:'Lucy Heartfilia se une al caótico gremio de magos Fairy Tail junto a Natsu y sus amigos.'},
  {malId:34572, title:'Black Clover',                      type:'TV', eps:170, year:2017, score:8.1, genres:['Action','Adventure','Fantasy','Comedy'],synopsis:'Asta, un niño sin magia, sueña con convertirse en el Rey Mago del reino.'},
  {malId:30276, title:'One Punch Man',                     type:'TV', eps:12,  year:2015, score:8.7, genres:['Action','Comedy','Sci-Fi'],             synopsis:'Saitama se aburre de ser héroe porque puede derrotar a cualquier enemigo de un solo golpe.'},
  {malId:36509, title:'Overlord',                          type:'TV', eps:13,  year:2015, score:7.9, genres:['Action','Adventure','Fantasy'],         synopsis:'Un jugador queda atrapado en su videojuego favorito como su personaje, un señor oscuro esquelético.'},
  {malId:38474, title:'Mob Psycho 100 II',                 type:'TV', eps:13,  year:2019, score:8.9, genres:['Action','Comedy','Supernatural'],       synopsis:'Shigeo "Mob" Kageyama continúa creciendo como persona mientras controla sus poderes psíquicos.'},
  {malId:23755, title:'Akatsuki no Yona',                  type:'TV', eps:24,  year:2014, score:8.1, genres:['Action','Adventure','Romance','Fantasy'],synopsis:'Una princesa huye de palacio tras la muerte de su padre y busca recuperar su reino.'},
  {malId:37999, title:'Boku no Hero Academia',             type:'TV', eps:13,  year:2016, score:7.9, genres:['Action','Comedy','Superhero'],          synopsis:'Izuku Midoriya nace sin poderes en un mundo de superhéroes pero sueña con ser el mejor héroe.'},
  {malId:33486, title:'Boku no Hero Academia 2nd Season',  type:'TV', eps:25,  year:2017, score:8.2, genres:['Action','Comedy','Superhero'],          synopsis:'El torneo escolar revela nuevos rivales y el oscuro pasado del villano Stain.'},
  {malId:36456, title:'Boku no Hero Academia 3rd Season',  type:'TV', eps:25,  year:2018, score:8.2, genres:['Action','Comedy','Superhero'],          synopsis:'Los alumnos enfrentan la Liga de Villanos en un campamento de entrenamiento.'},
  {malId:50739, title:'Blue Lock',                         type:'TV', eps:24,  year:2022, score:8.4, genres:['Sports','Drama'],                       synopsis:'300 jóvenes futbolistas compiten en un programa extremo para crear al mejor delantero del mundo.'},
  {malId:40748, title:'Vinland Saga Season 2',             type:'TV', eps:24,  year:2023, score:9.0, genres:['Action','Adventure','Drama'],           synopsis:'Thorfinn trabaja como esclavo mientras busca encontrar su verdadero propósito en la vida.'},
  {malId:37521, title:'Vinland Saga',                      type:'TV', eps:24,  year:2019, score:8.7, genres:['Action','Adventure','Drama'],           synopsis:'Thorfinn busca venganza contra el hombre que mató a su padre en las tierras vikingas.'},
  {malId:2001,  title:'Katekyo Hitman Reborn!',            type:'TV', eps:203, year:2006, score:8.1, genres:['Action','Comedy','Supernatural'],       synopsis:'Tsuna Sawada descubre que es el heredero de una familia mafiosa italiana y recibe entrenamiento.'},

  // ── AVENTURA ────────────────────────────────────────────────────────────────
  {malId:34599, title:'Made in Abyss',                     type:'TV', eps:13,  year:2017, score:8.7, genres:['Adventure','Fantasy','Drama'],          synopsis:'Riko desciende al misterioso Abismo para encontrar a su madre exploradora.'},
  {malId:36862, title:'Made in Abyss Movie 3: Fukaki Tamashii no Reimei', type:'Movie',eps:1, year:2020, score:8.7, genres:['Adventure','Fantasy','Drama'], synopsis:'Riko y Reg llegan a la quinta capa y encuentran a Nanachi.'},
  {malId:457,   title:'Mushishi',                          type:'TV', eps:26,  year:2005, score:8.7, genres:['Adventure','Mystery','Supernatural'],   synopsis:'Ginko viaja por el Japón feudal estudiando criaturas místicas llamadas Mushi.'},
  {malId:28851, title:'Mushishi Zoku Shou',                type:'TV', eps:10,  year:2014, score:8.8, genres:['Adventure','Mystery','Supernatural'],   synopsis:'Ginko continúa sus viajes encontrando historias sobre los misteriosos Mushi.'},
  {malId:6,     title:'Trigun',                            type:'TV', eps:26,  year:1998, score:8.2, genres:['Action','Adventure','Sci-Fi','Comedy'],  synopsis:'Vash the Stampede, el hombre más peligroso del mundo, resulta ser inofensivo y pacifista.'},
  {malId:205,   title:'Samurai Champloo',                  type:'TV', eps:26,  year:2004, score:8.5, genres:['Action','Adventure','Comedy'],           synopsis:'Dos espadachines de estilos opuestos y una chica viajan por el Japón del período Edo.'},
  {malId:392,   title:'Fullmetal Alchemist (2003)',         type:'TV', eps:51,  year:2003, score:8.1, genres:['Action','Adventure','Drama','Fantasy'],  synopsis:'Los hermanos Elric buscan la Piedra Filosofal para restaurar sus cuerpos.'},

  // ── SCI-FI ──────────────────────────────────────────────────────────────────
  {malId:1,     title:'Cowboy Bebop',                      type:'TV', eps:26,  year:1998, score:8.8, genres:['Action','Adventure','Sci-Fi','Drama'],   synopsis:'Cazarrecompensas vagabundean por el sistema solar en el año 2071.'},
  {malId:849,   title:'Neon Genesis Evangelion',           type:'TV', eps:26,  year:1995, score:8.3, genres:['Action','Mecha','Sci-Fi','Drama'],       synopsis:'Adolescentes pilotan robots gigantes contra ángeles apocalípticos mientras lidian con traumas.'},
  {malId:32281, title:'Kimi no Na wa.',                    type:'Movie',eps:1, year:2016, score:8.9, genres:['Romance','Drama','Supernatural'],        synopsis:'Dos adolescentes se intercambian de cuerpo misteriosamente y se enamoran.'},
  {malId:431,   title:'Howl\'s Moving Castle',             type:'Movie',eps:1, year:2004, score:8.7, genres:['Adventure','Fantasy','Romance'],         synopsis:'Sophie es maldecida como anciana y se embarca en una aventura con el mago Howl.'},
  {malId:513,   title:'Paprika',                           type:'Movie',eps:1, year:2006, score:8.1, genres:['Sci-Fi','Drama','Fantasy'],              synopsis:'Una psicóloga usa tecnología para entrar en los sueños de sus pacientes.'},
  {malId:572,   title:'Ghost in the Shell',                type:'Movie',eps:1, year:1995, score:8.3, genres:['Action','Mecha','Sci-Fi'],               synopsis:'La Mayor Motoko Kusanagi caza a un hacker llamado Puppet Master en un futuro cyberpunk.'},
  {malId:13601, title:'Psycho-Pass',                       type:'TV', eps:22,  year:2012, score:8.4, genres:['Action','Sci-Fi','Thriller'],            synopsis:'En un futuro donde el crimen se predice, una inspectora cuestiona el sistema.'},
  {malId:9756,  title:'Steins;Gate 0',                     type:'TV', eps:23,  year:2018, score:8.6, genres:['Sci-Fi','Drama','Thriller'],             synopsis:'Okabe abandona el viaje en el tiempo y vive con la culpa de no poder salvar a Kurisu.'},
  {malId:23273, title:'Parasyte -the maxim-',              type:'TV', eps:24,  year:2014, score:8.4, genres:['Action','Horror','Sci-Fi'],              synopsis:'Un parásito alienígena intenta tomar el cerebro de Shinichi pero solo consigue su mano.'},
  {malId:38000, title:'Darling in the FranXX',             type:'TV', eps:24,  year:2018, score:7.3, genres:['Action','Drama','Mecha','Romance'],      synopsis:'Jóvenes pilotan robots en parejas para luchar contra criaturas llamadas Klaxosaurs.'},

  // ── MECHA ───────────────────────────────────────────────────────────────────
  {malId:6336,  title:'Code Geass: Lelouch of the Re;surrection',type:'Movie',eps:1,year:2019,score:8.0,genres:['Action','Mecha','Sci-Fi'],            synopsis:'Lelouch resucita con un nuevo propósito en un mundo cambiado.'},
  {malId:80,    title:'Gundam Wing',                       type:'TV', eps:49,  year:1995, score:7.8, genres:['Action','Drama','Mecha','Sci-Fi'],       synopsis:'Cinco pilotos de Gundam luchan contra una federación militar que oprime a las colonias espaciales.'},
  {malId:42422, title:'86 Eighty-Six',                     type:'TV', eps:11,  year:2021, score:8.5, genres:['Action','Drama','Mecha','Sci-Fi'],       synopsis:'Una comandante lidera a soldados discriminados que pilotan drones en una guerra sin piedad.'},
  {malId:47,    title:'Great Teacher Onizuka',             type:'TV', eps:43,  year:1999, score:8.7, genres:['Comedy','Drama','School'],               synopsis:'Un exgangster se convierte en maestro de la peor clase para cambiar la vida de sus alumnos.'},

  // ── FANTASY / ISEKAI ────────────────────────────────────────────────────────
  {malId:39535, title:'Kimetsu no Yaiba: Mugen Ressha-hen',type:'Movie',eps:1, year:2020, score:8.3, genres:['Action','Fantasy','Drama'],             synopsis:'Tanjiro y su grupo protegen un tren maldecido junto al Pilar de las Llamas.'},
  {malId:14719, title:'Magi: The Labyrinth of Magic',      type:'TV', eps:25,  year:2012, score:8.0, genres:['Action','Adventure','Fantasy'],         synopsis:'Aladdin y Alibaba exploran calabozos mágicos para alcanzar sus sueños.'},
  {malId:40591, title:'Re:Zero 2nd Season',                type:'TV', eps:13,  year:2020, score:8.4, genres:['Fantasy','Drama','Thriller'],            synopsis:'Subaru llega al santuario y descubre terribles verdades sobre su poder de resurrección.'},
  {malId:47778, title:'Mushoku Tensei: Isekai Ittara Honki Dasu', type:'TV',eps:11,year:2021,score:8.4,genres:['Adventure','Fantasy','Drama'],         synopsis:'Un hombre reencarna en un mundo de magia decidido a vivir su vida sin arrepentimientos.'},
  {malId:49596, title:'Mushoku Tensei II: Isekai Ittara Honki Dasu', type:'TV',eps:12,year:2023,score:8.8,genres:['Adventure','Fantasy','Drama'],      synopsis:'Rudeus viaja buscando a su madre y enfrentando las consecuencias del desplazamiento mágico.'},
  {malId:34798, title:'Violet Evergarden',                 type:'TV', eps:13,  year:2018, score:8.7, genres:['Drama','Fantasy','Slice of Life'],       synopsis:'Una ex soldado aprende a comprender las emociones humanas escribiendo cartas para otros.'},
  {malId:28891, title:'Overlord II',                       type:'TV', eps:13,  year:2018, score:7.7, genres:['Action','Adventure','Fantasy'],          synopsis:'Ainz expande su dominio desde la Gran Tumba de Nazarick sobre las naciones del mundo.'},
  {malId:36890, title:'Overlord III',                      type:'TV', eps:13,  year:2018, score:7.6, genres:['Action','Adventure','Fantasy'],          synopsis:'Ainz establece el Imperio de Ainz Ooal Gown mientras nuevos conflictos emergen.'},
  {malId:35073, title:'That Time I Got Reincarnated as a Slime', type:'TV',eps:24,year:2018,score:8.0,genres:['Action','Adventure','Fantasy','Comedy'],synopsis:'Un hombre es reencarnado como la más débil criatura de un mundo de fantasía pero resulta ser overpowered.'},
  {malId:41025, title:'Tate no Yuusha no Nariagari',       type:'TV', eps:25,  year:2019, score:8.1, genres:['Action','Adventure','Fantasy','Drama'],  synopsis:'Naofumi es invocado como el Héroe del Escudo, el más débil, y es traicionado desde el principio.'},
  {malId:36474, title:'Violet Evergarden: Eternity and the Auto Memory Doll', type:'Movie',eps:1,year:2019,score:8.8,genres:['Drama','Fantasy'],       synopsis:'Violet trabaja como tutora en un internado femenino y conoce a dos hermanas muy distintas.'},
  {malId:44055, title:'Tensei shitara Slime Datta Ken 2nd Season', type:'TV',eps:24,year:2021,score:8.2,genres:['Action','Adventure','Fantasy'],       synopsis:'Rimuru establece su nación monstruo y enfrenta amenazas que quieren destruirla.'},

  // ── ROMANCE / SLICE OF LIFE ─────────────────────────────────────────────────
  {malId:4224,  title:'Toradora!',                         type:'TV', eps:25,  year:2008, score:8.1, genres:['Comedy','Drama','Romance','School'],    synopsis:'Dos estudiantes de carácter opuesto se unen para ayudarse a conquistar a sus respectivos amores.'},
  {malId:22101, title:'Gekkan Shoujo Nozaki-kun',          type:'TV', eps:12,  year:2014, score:8.1, genres:['Comedy','Romance','School'],            synopsis:'Chiyo confiesa su amor a Nozaki y descubre que es un famoso mangaka de shojo.'},
  {malId:43608, title:'Kaguya-sama wa Kokurasetai',        type:'TV', eps:12,  year:2019, score:8.5, genres:['Comedy','Romance','School'],            synopsis:'Dos estudiantes del consejo escolar intentan que el otro confiese su amor primero.'},
  {malId:40835, title:'Kaguya-sama: Love is War - Ultra Romantic', type:'TV',eps:13,year:2022,score:9.0,genres:['Comedy','Romance','School'],         synopsis:'La batalla psicológica del amor entre Kaguya y Miyuki alcanza su punto más intenso.'},
  {malId:14813, title:'Chuunibyou demo Koi ga Shitai!',   type:'TV', eps:12,  year:2012, score:7.9, genres:['Comedy','Drama','Romance','School'],    synopsis:'Yuuta intenta olvidar su vergonzoso pasado chuunibyou pero conoce a una chica que aún lo vive.'},
  {malId:10087, title:'Clannad: After Story',              type:'TV', eps:24,  year:2008, score:9.0, genres:['Drama','Romance','Slice of Life'],      synopsis:'Tomoya y Nagisa construyen una vida juntos enfrentando las alegrías y tragedias de la adultez.'},
  {malId:4181,  title:'Clannad',                           type:'TV', eps:23,  year:2007, score:8.0, genres:['Comedy','Drama','Romance','School'],    synopsis:'Tomoya Okazaki conoce a Nagisa Furukawa y su grupo de amigas cambian su vida.'},
  {malId:40397, title:'Horimiya',                          type:'TV', eps:13,  year:2021, score:8.2, genres:['Comedy','Romance','School','Slice of Life'],synopsis:'La popular Hori y el tímido Miyamura descubren sus verdaderas personalidades fuera del colegio.'},
  {malId:32615, title:'Yuri!!! on Ice',                    type:'TV', eps:12,  year:2016, score:8.1, genres:['Sports','Drama','Romance'],             synopsis:'El patinador Yuri Katsuki es entrenado por su ídolo ruso Victor Nikiforov.'},
  {malId:37450, title:'Wotaku ni Koi wa Muzukashii',       type:'TV', eps:11,  year:2018, score:7.9, genres:['Comedy','Romance','Slice of Life'],     synopsis:'Dos otakus adultos que se reencuentran en el trabajo deciden salir juntos.'},
  {malId:13759, title:'Yahari Ore no Seishun Love Comedy wa Machigatteiru.', type:'TV',eps:13,year:2013,score:8.0,genres:['Comedy','Drama','Romance','School'],synopsis:'El cínico Hachiman es forzado a unirse al club de servicio donde aprende sobre las relaciones humanas.'},

  // ── DRAMA / SEINEN ──────────────────────────────────────────────────────────
  {malId:31758, title:'Mob Psycho 100',                    type:'TV', eps:12,  year:2016, score:8.5, genres:['Action','Comedy','Supernatural'],       synopsis:'Shigeo "Mob" Kageyama, con poderes psíquicos extremos, intenta llevar una vida normal.'},
  {malId:44511, title:'Odd Taxi',                          type:'TV', eps:13,  year:2021, score:8.7, genres:['Mystery','Drama','Thriller'],           synopsis:'Un taxista morsa introvertido se ve envuelto en una serie de misterios en la ciudad.'},
  {malId:35180, title:'March Comes in Like a Lion',        type:'TV', eps:22,  year:2016, score:8.7, genres:['Drama','Slice of Life','Sports'],       synopsis:'Un joven maestro de shogi lucha con la soledad y el peso de sus responsabilidades.'},
  {malId:820,   title:'Gankutsuou: The Count of Monte Cristo', type:'TV',eps:24,year:2004,score:8.4,genres:['Drama','Mystery','Sci-Fi'],               synopsis:'Adaptación futurista de la novela de Alejandro Dumas con una estética visual única.'},
  {malId:3297,  title:'Kaiji',                             type:'TV', eps:26,  year:2007, score:8.4, genres:['Drama','Game','Thriller'],              synopsis:'Kaiji Itou es arrastrado a juegos de apuestas ilegales donde la vida está en juego.'},
  {malId:15,    title:'Eyeshield 21',                      type:'TV', eps:145, year:2005, score:7.9, genres:['Comedy','Sports'],                      synopsis:'Sena Kobayakawa usa sus habilidades de corredor para brillar en el fútbol americano.'},

  // ── HORROR / THRILLER ───────────────────────────────────────────────────────
  {malId:40028, title:'Higurashi no Naku Koro ni',         type:'TV', eps:26,  year:2006, score:8.0, genres:['Horror','Mystery','Supernatural'],      synopsis:'En un pequeño pueblo, cada año el festival de verano termina en muerte y locura.'},
  {malId:777,   title:'Hellsing Ultimate',                 type:'OVA',eps:10,  year:2006, score:8.4, genres:['Action','Horror','Supernatural'],       synopsis:'La organización Hellsing usa al poderoso vampiro Alucard para eliminar amenazas sobrenaturales.'},
  {malId:37987, title:'Devilman Crybaby',                  type:'ONA',eps:10,  year:2018, score:7.8, genres:['Action','Horror','Supernatural','Drama'],synopsis:'Akira Fudou se fusiona con un demonio para proteger a la humanidad a costa de su humanidad.'},
  {malId:199,   title:'Sen to Chihiro no Kamikakushi',     type:'Movie',eps:1, year:2001, score:8.9, genres:['Adventure','Drama','Fantasy','Supernatural'],synopsis:'Chihiro cae en el mundo de los espíritus y debe trabajar para salvar a sus padres.'},

  // ── COMEDIA ─────────────────────────────────────────────────────────────────
  {malId:30831, title:'Konosuba',                          type:'TV', eps:10,  year:2016, score:8.2, genres:['Adventure','Comedy','Fantasy'],         synopsis:'Kazuma muere de vergüenza y renace en un mundo de fantasía con la diosa más inútil.'},
  {malId:35870, title:'Konosuba: God\'s Blessing on This Wonderful World! 2', type:'TV',eps:10,year:2017,score:8.5,genres:['Adventure','Comedy','Fantasy'],synopsis:'Las aventuras del grupo más disfuncional de héroes continúan con más caos y explosiones.'},
  {malId:918,   title:'Gintama',                           type:'TV', eps:201, year:2006, score:9.0, genres:['Action','Comedy','Sci-Fi'],             synopsis:'Las primeras aventuras del samurai Gintoki en un Japón ocupado por extraterrestres.'},
  {malId:28977, title:'Ouran Koukou Host Club',            type:'TV', eps:26,  year:2006, score:8.2, genres:['Comedy','Drama','Romance','School'],    synopsis:'Haruhi rompe un jarrón caro y debe unirse al club de anfitriones del colegio para pagar la deuda.'},
  {malId:12355, title:'Nichijou',                          type:'TV', eps:26,  year:2011, score:8.5, genres:['Comedy','Slice of Life'],               synopsis:'Las absurdas aventuras de tres amigas de preparatoria en una ciudad llena de situaciones surrealistas.'},
  {malId:8247,  title:'Danshi Koukousei no Nichijou',      type:'TV', eps:12,  year:2012, score:8.4, genres:['Comedy','School','Slice of Life'],      synopsis:'Las hilarantes e inútiles conversaciones y aventuras de tres amigos de preparatoria masculina.'},

  // ── DEPORTES ────────────────────────────────────────────────────────────────
  {malId:20583, title:'Haikyuu!!',                         type:'TV', eps:25,  year:2014, score:8.7, genres:['Comedy','Drama','Sports'],              synopsis:'Shouyou Hinata, de baja estatura, sueña con ser el mejor en voleibol universitario.'},
  {malId:28891, title:'Haikyuu!! 2nd Season',              type:'TV', eps:25,  year:2015, score:8.8, genres:['Comedy','Drama','Sports'],              synopsis:'Karasuno trabaja en sus debilidades para ganar el torneo y llegar a los nacionales.'},
  {malId:32935, title:'Haikyuu!!: Karasuno Koukou VS Shiratorizawa Gakuen Koukou', type:'TV',eps:10,year:2016,score:9.1,genres:['Drama','Sports'],    synopsis:'Karasuno enfrenta al campeón de la prefectura Shiratorizawa en el partido más importante.'},
  {malId:24833, title:'Ping Pong the Animation',           type:'TV', eps:11,  year:2014, score:8.6, genres:['Drama','Sports'],                       synopsis:'Dos amigos de secundaria con talentos opuestos buscan su lugar en el tenis de mesa.'},
  {malId:856,   title:'Hajime no Ippo',                    type:'TV', eps:75,  year:2000, score:8.8, genres:['Comedy','Drama','Sports'],              synopsis:'Makunouchi Ippo es intimidado hasta que un boxeador profesional lo inspira a entrenar.'},
  {malId:10800, title:'Kuroko no Basket',                  type:'TV', eps:25,  year:2012, score:8.1, genres:['Comedy','Sports'],                      synopsis:'El fantasma del baloncesto Kuroko se une a un equipo débil para ganar el campeonato nacional.'},
  {malId:35540, title:'Ballroom e Youkoso',                type:'TV', eps:24,  year:2017, score:8.1, genres:['Drama','Romance','Sports'],             synopsis:'Tatara Fujita descubre el mundo del baile de salón y se obsesiona con alcanzar la cima.'},
  {malId:41587, title:'Sk8 the Infinity',                  type:'TV', eps:12,  year:2021, score:8.3, genres:['Comedy','Sports'],                      synopsis:'Reki, un apasionado del skate, conoce a Langa, un snowboarder canadiense que aprende skating.'},

  // ── PSICOLÓGICO ─────────────────────────────────────────────────────────────
  {malId:1699,  title:'Berserk',                           type:'TV', eps:25,  year:1997, score:8.6, genres:['Action','Adventure','Drama','Fantasy'],  synopsis:'Guts, el espadachín solitario, se une a la Banda del Halcón de Griffith en una guerra medieval.'},
  {malId:11307, title:'Psycho-Pass 2',                     type:'TV', eps:11,  year:2014, score:7.4, genres:['Action','Sci-Fi','Thriller'],            synopsis:'Akane Tsunemori enfrenta a un nuevo criminal que desafía al sistema Sybil.'},
  {malId:6547,  title:'Angel Beats!',                      type:'TV', eps:13,  year:2010, score:8.1, genres:['Action','Comedy','Drama','Supernatural'],synopsis:'Estudiantes en el limbo luchan contra el destino en un instituto escolar del más allá.'},
  {malId:41457, title:'Wonder Egg Priority',               type:'TV', eps:12,  year:2021, score:8.0, genres:['Drama','Fantasy','Psychological'],       synopsis:'Ai Ohto ingresa al mundo de los sueños para revivir a su mejor amiga luchando contra demonios.'},
  {malId:5530,  title:'Suzumiya Haruhi no Yuuutsu',        type:'TV', eps:14,  year:2006, score:8.1, genres:['Comedy','Mystery','Sci-Fi','Supernatural'],synopsis:'Kyon se une al SOS Brigade de Haruhi, quien sin saberlo tiene el poder de alterar la realidad.'},
  {malId:339,   title:'Serial Experiments Lain',           type:'TV', eps:13,  year:1998, score:8.0, genres:['Drama','Mystery','Sci-Fi','Supernatural'],synopsis:'Lain, una niña tímida, se adentra en "La Red" y comienza a cuestionar su propia identidad.'},

  // ── SLICE OF LIFE ────────────────────────────────────────────────────────────
  {malId:9617,  title:'Hyouka',                            type:'TV', eps:22,  year:2012, score:8.1, genres:['Mystery','Romance','School','Slice of Life'],synopsis:'Houtarou Oreki el apático es arrastrado por la curiosa Eru Chitanda a resolver misterios cotidianos.'},
  {malId:22817, title:'Barakamon',                         type:'TV', eps:12,  year:2014, score:8.4, genres:['Comedy','Slice of Life'],                synopsis:'Un joven calígrafo es enviado a una isla rural donde aprende el verdadero sentido de su arte.'},
  {malId:45,    title:'Rurouni Kenshin',                   type:'TV', eps:94,  year:1996, score:8.3, genres:['Action','Adventure','Drama','Romance'],   synopsis:'Kenshin Himura, el legendario asesino del Bakumatsu, vive en paz prometiendo no matar.'},
  {malId:12189, title:'Nagi no Asukara',                   type:'TV', eps:26,  year:2013, score:8.1, genres:['Drama','Fantasy','Romance'],             synopsis:'Cuatro amigos del fondo del mar deben ir a la escuela en la superficie y enfrentan conflictos.'},
  {malId:32,    title:'Neon Genesis Evangelion: The End of Evangelion', type:'Movie',eps:1,year:1997,score:8.4,genres:['Action','Drama','Mecha','Sci-Fi'],synopsis:'El finale alternativo de Evangelion muestra el Tercer Impacto desde la perspectiva de Shinji.'},
  {malId:35839, title:'A Silent Voice',                    type:'Movie',eps:1, year:2016, score:9.0, genres:['Drama','Romance','School'],             synopsis:'Shoya Ishida busca redimir su pasado como bully haciendo las paces con Shoko Nishimiya, sorda.'},
  {malId:40852, title:'Fruits Basket: The Final',          type:'TV', eps:13,  year:2021, score:8.8, genres:['Drama','Fantasy','Romance','Slice of Life'],synopsis:'Tohru finalmente descubrirá cómo romper la maldición que ata a los Sohma.'},
  {malId:356,   title:'Fullmetal Panic!',                  type:'TV', eps:24,  year:2002, score:7.8, genres:['Action','Comedy','Drama','Mecha'],       synopsis:'Un soldado de élite es asignado para proteger a una chica normal sin saber por qué es tan importante.'},
  {malId:37786, title:'Yojouhan Shinwa Taikei',            type:'TV', eps:11,  year:2010, score:8.5, genres:['Comedy','Mystery','Romance'],            synopsis:'Un estudiante universitario repite sus años de universidad en líneas temporales distintas buscando su "vida rosa".'},
];

// ════════════════════════════════════════════════
// LOCAL_CATALOG — picture siempre null al inicio
// ════════════════════════════════════════════════
const LOCAL_CATALOG = LOCAL_DB.map(a => ({
    ...a,
    episodes:    a.eps,
    picture:     null,
    score:       String(a.score),
    studios:     a.studios || [],
    synopsis:    a.synopsis || '',
    slug:        null,
    url:         null,
    id:          a.malId,
    _jikanDone:  false,
}));

// ════════════════════════════════════════════════
// JIKAN — enriquecimiento en background
// ════════════════════════════════════════════════
const JIKAN = 'https://api.jikan.moe/v4';

async function enrichWithJikan(catalog, onUpdate) {
    const toEnrich = catalog.filter(a => !a._jikanDone).slice(0, 80);

    const DELAY_MS    = 1100;
    const RETRY_MS    = 5000;
    const NOTIFY_EVERY = 5;

    for (let i = 0; i < toEnrich.length; i++) {
        const anime = toEnrich[i];

        try {
            let r = null;

            if (anime.malId) {
                r = await fetch(`${JIKAN}/anime/${anime.malId}`);
                if (r.status === 429) {
                    await delay(RETRY_MS);
                    r = await fetch(`${JIKAN}/anime/${anime.malId}`);
                }
            }

            if (!r || !r.ok) {
                r = await fetch(`${JIKAN}/anime?q=${encodeURIComponent(anime.title)}&limit=1`);
                if (r.status === 429) {
                    await delay(RETRY_MS);
                    r = await fetch(`${JIKAN}/anime?q=${encodeURIComponent(anime.title)}&limit=1`);
                }
            }

            if (!r || !r.ok) { await delay(DELAY_MS); continue; }

            const d = await r.json();
            const a = anime.malId ? d.data : d.data?.[0];
            if (!a) { await delay(DELAY_MS); continue; }

            const img =
                a.images?.webp?.large_image_url ||
                a.images?.jpg?.large_image_url  ||
                a.images?.jpg?.image_url        ||
                null;

            if (img)               anime.picture  = img;
            if (a.score)           anime.score    = String(a.score);
            if (a.synopsis)        anime.synopsis = a.synopsis;
            if (a.genres?.length)  anime.genres   = a.genres.map(g => g.name);
            if (a.studios?.length) anime.studios  = a.studios.map(s => s.name);
            if (a.episodes)        anime.episodes = a.episodes;
            if (a.year)            anime.year     = a.year;
            anime._jikanDone = true;

        } catch (_) {}

        if ((i + 1) % NOTIFY_EVERY === 0 && typeof onUpdate === 'function') {
            onUpdate(catalog);
        }

        await delay(DELAY_MS);
    }

    if (typeof onUpdate === 'function') onUpdate(catalog);
    setCache(catalog);
}

// ════════════════════════════════════════════════
// BÚSQUEDA EN APIs PROPIAS
// ════════════════════════════════════════════════
async function apiSearch(api, term, limit = 20) {
    try {
        const r = await fetch(
            `${api.baseUrl}/search?q=${encodeURIComponent(term)}&limit=${limit}`,
            { headers: { [api.authHeader]: api.apiKey } }
        );
        if (!r.ok) return [];
        const d = await r.json();
        return d?.data?.results || d?.results || d?.data || [];
    } catch (_) { return []; }
}

// ════════════════════════════════════════════════
// MEZCLA ALEATORIA
// ════════════════════════════════════════════════
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ════════════════════════════════════════════════
// TÉRMINOS para APIs propias
// ════════════════════════════════════════════════
const TERMS = [
    'action','romance','fantasy','horror','comedy','sports','mecha',
    'drama','adventure','mystery','school','isekai','sci-fi',
    'psychological','slice of life','demon slayer','jujutsu kaisen',
    'one piece','attack on titan','fullmetal','death note',
    'hunter x hunter','chainsaw man','spy x family','re zero',
    'haikyuu','vinland saga','frieren','steins gate',
];

// ════════════════════════════════════════════════
// BUILD CATALOG
// ════════════════════════════════════════════════
let _enrichCallback = null;

async function buildCatalog() {
    console.log('🏗️ Construyendo catálogo...');

    const seen  = new Set(LOCAL_CATALOG.map(a => a.title.toLowerCase()));
    const extra = [];

    const tasks = [];
    for (const term of TERMS) for (const api of CONFIG.APIS) tasks.push({ api, term });

    const BATCH = 8;
    for (let i = 0; i < tasks.length; i += BATCH) {
        const batch   = tasks.slice(i, i + BATCH);
        const results = await Promise.all(
            batch.map(({ api, term }) => apiSearch(api, term, 15))
        );
        for (const list of results) {
            for (const a of list) {
                if (!a.title) continue;
                const key = a.title.toLowerCase().trim();
                if (seen.has(key)) continue;
                seen.add(key);
                extra.push({
                    id:         a.id    ?? null,
                    malId:      a.mal_id ?? null,
                    title:      a.title,
                    slug:       a.slug  ?? null,
                    type:       a.type  ?? 'TV',
                    episodes:   a.episodes ?? null,
                    url:        a.url   ?? null,
                    year:       a.year  ?? null,
                    score:      a.score ? String(a.score) : null,
                    genres:     a.genres   ?? [],
                    picture:    a.picture  ?? null,
                    synopsis:   a.synopsis ?? '',
                    studios:    [],
                    _jikanDone: !!a.picture,
                });
            }
        }
        if (LOCAL_CATALOG.length + extra.length >= 600) break;
    }

    console.log(`📋 Local: ${LOCAL_CATALOG.length} | APIs: ${extra.length}`);

    const all = [...LOCAL_CATALOG, ...shuffle(extra)];
    setCache(all);

    enrichWithJikan(all, _enrichCallback).catch(() => {});

    return all;
}

// ════════════════════════════════════════════════
// EXPORT PRINCIPAL — searchAnime
// ════════════════════════════════════════════════
export async function searchAnime(_query, onUpdate) {
    if (typeof onUpdate === 'function') _enrichCallback = onUpdate;

    const cached = getCache();
    if (cached?.length > 0) {
        console.log(`📦 Caché: ${cached.length} animes`);
        const needImg = cached.filter(a => !a._jikanDone);
        if (needImg.length > 0 && typeof onUpdate === 'function') {
            enrichWithJikan(cached, onUpdate).catch(() => {});
        }
        return shuffle(cached);
    }

    return buildCatalog();
}

// ════════════════════════════════════════════════
// BUSCADOR — searchQuery (local + Jikan fallback)
// Esta función es la que usa doSearch() en anime.html
// ════════════════════════════════════════════════
export async function searchQuery(query, catalog) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return catalog;

    // Búsqueda local: título, géneros y sinopsis
    const local = catalog.filter(a =>
        (a.title    || '').toLowerCase().includes(q) ||
        (a.genres   || []).some(g => g.toLowerCase().includes(q)) ||
        (a.synopsis || '').toLowerCase().includes(q)
    );

    // Si hay suficientes resultados locales, devolverlos sin llamar a Jikan
    if (local.length >= 5) return local;

    // Fallback: buscar en Jikan con el término original (no lowercase)
    try {
        const r = await fetch(
            `${JIKAN}/anime?q=${encodeURIComponent(query.trim())}&limit=20&order_by=score&sort=desc`
        );
        if (!r.ok) return local;
        const d = await r.json();

        const seen = new Set(local.map(a => (a.title || '').toLowerCase()));
        const jikanResults = (d.data || [])
            .filter(a => a.title && !seen.has((a.title_english || a.title || '').toLowerCase()))
            .map(a => ({
                malId:      a.mal_id,
                title:      a.title_english || a.title,
                type:       a.type    || 'TV',
                episodes:   a.episodes ?? null,
                url:        null,
                year:       a.year    ?? null,
                score:      a.score   ? String(a.score) : null,
                genres:     a.genres?.map(g => g.name) || [],
                picture:    a.images?.jpg?.large_image_url ||
                            a.images?.jpg?.image_url       || null,
                synopsis:   a.synopsis || '',
                studios:    a.studios?.map(s => s.name) || [],
                _jikanDone: true,
            }));

        return [...local, ...jikanResults];
    } catch (_) {
        return local;
    }
}

// ════════════════════════════════════════════════
// CATEGORÍAS — filtrado local
// ════════════════════════════════════════════════
export async function searchByCategory(category, catalog) {
    const all = catalog?.length > 0 ? catalog : (await searchAnime('anime'));

    if (category === 'all') return all;

    if (category === 'popular') {
        return [...all]
            .filter(a => a.score)
            .sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
    }

    if (category === 'new') {
        const yr = new Date().getFullYear();
        const r  = all
            .filter(a => a.year && parseInt(a.year) >= yr - 2)
            .sort((a, b) => (b.year || 0) - (a.year || 0));
        return r.length >= 5 ? r : [...all]
            .sort((a, b) => (b.year || 0) - (a.year || 0))
            .slice(0, 60);
    }

    const genreMap = {
        action:    ['Action','Shounen'],
        adventure: ['Adventure'],
        romance:   ['Romance','Shoujo'],
        comedy:    ['Comedy','Slice of Life'],
        fantasy:   ['Fantasy','Supernatural','Isekai'],
        horror:    ['Horror','Thriller'],
        drama:     ['Drama','Seinen'],
        scifi:     ['Sci-Fi','Space','Mecha'],
        sports:    ['Sports'],
        mecha:     ['Mecha'],
    };
    const kw = {
        action:    ['naruto','bleach','demon slayer','jujutsu','attack on titan','chainsaw'],
        adventure: ['one piece','fairy tail','vinland','frieren','made in abyss'],
        romance:   ['toradora','clannad','your name','kaguya','horimiya'],
        comedy:    ['spy x family','konosuba','gintama','grand blue'],
        fantasy:   ['re zero','sword art','black clover','overlord','mushoku'],
        horror:    ['tokyo ghoul','parasyte','hellsing','another','higurashi'],
        drama:     ['death note','fullmetal','erased','violet evergarden'],
        scifi:     ['steins gate','psycho pass','cowboy bebop','evangelion'],
        sports:    ['haikyuu','blue lock','kuroko','yuri on ice','slam dunk'],
        mecha:     ['evangelion','gundam','code geass','darling'],
    };

    const genres   = genreMap[category] || [];
    const keywords = kw[category]       || [];

    const byGenre = all.filter(a =>
        a.genres?.some(g =>
            genres.some(gk => g.toLowerCase().includes(gk.toLowerCase()))
        )
    );
    if (byGenre.length >= 8) return byGenre;

    const byKw = all.filter(a =>
        keywords.some(k => (a.title || '').toLowerCase().includes(k))
    );
    const merged = [
        ...new Map([...byGenre, ...byKw].map(a => [a.title, a])).values()
    ];
    return merged.length >= 4 ? merged : all.slice(0, 60);
}

// ════════════════════════════════════════════════
// REPRODUCCIÓN
// ════════════════════════════════════════════════
export async function getAnimeInfo(animeUrl) {
    for (const api of CONFIG.APIS) {
        try {
            const r = await fetch(
                `${api.baseUrl}/info?url=${encodeURIComponent(animeUrl)}`,
                { headers: { [api.authHeader]: api.apiKey } }
            );
            if (!r.ok) continue;
            const d  = await r.json();
            const ep = d?.data?.episodes || d?.episodes || [];
            if (ep.length > 0) return d;
        } catch (_) {}
    }
    return null;
}

export async function getEpisodeUrl(episodeUrl) {
    for (const api of CONFIG.APIS) {
        try {
            const r = await fetch(
                `${api.baseUrl}/episode?url=${encodeURIComponent(episodeUrl)}`,
                { headers: { [api.authHeader]: api.apiKey } }
            );
            if (!r.ok) continue;
            const d   = await r.json();
            const url = d?.url || d?.data?.url || d?.data?.videoUrl || d?.videoUrl;
            if (url) return url;
        } catch (_) {}
    }
    return null;
}

export async function getAnimeDetails(title) {
    try {
        const r = await fetch(
            `${JIKAN}/anime?q=${encodeURIComponent(title)}&limit=1`
        );
        if (!r.ok) return null;
        const d = await r.json();
        const a = d.data?.[0];
        if (!a) return null;
        return {
            synopsis: a.synopsis || 'Sin descripción.',
            score:    a.score,
            year:     a.year,
            genres:   a.genres?.map(g => g.name)  || [],
            studios:  a.studios?.map(s => s.name) || [],
            episodes: a.episodes,
            type:     a.type,
            malId:    a.mal_id,
            picture:  a.images?.jpg?.large_image_url || a.images?.jpg?.image_url,
        };
    } catch (_) { return null; }
}

// ════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════
export function buildAnime1vUrl(title) {
    if (!title) return '#';
    return 'https://animeav1.com/media/' +
        title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
export function buildAnimeUrl(title) { return buildAnime1vUrl(title); }

export function clearCache() {
    localStorage.removeItem(CACHE_KEY);
    console.log('🗑️ Caché limpiado');
    location.reload();
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }