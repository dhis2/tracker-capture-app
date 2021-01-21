/* global angular, moment, dhis2 */

'use strict';

/* Services */

var externalLookupServices = angular.module('externalLookupServices', ['ngResource'])

.service('FNrLookupService', function($http, DHIS2URL, $translate, NotificationService) {
        var not_supported_message_shown_previously = false;

        var land = [{"id":3526,"verdi":"204","beskrivelse":"Angola","oId":80007},{"id":3527,"verdi":"393","beskrivelse":"Burkina Faso","oId":80007},{"id":3528,"verdi":"216","beskrivelse":"Burundi","oId":80007},{"id":3529,"verdi":"229","beskrivelse":"Benin","oId":80007},{"id":3530,"verdi":"205","beskrivelse":"Botswana","oId":80007},{"id":3531,"verdi":"279","beskrivelse":"Kongo (Dem.Rep.)","oId":80007},{"id":3532,"verdi":"358","beskrivelse":"Sør-Sudan","oId":80007},{"id":3533,"verdi":"379","beskrivelse":"Tunisia","oId":80007},{"id":3534,"verdi":"369","beskrivelse":"Tanzania","oId":80007},{"id":3535,"verdi":"386","beskrivelse":"Uganda","oId":80007},{"id":3536,"verdi":"359","beskrivelse":"Sør-Afrika","oId":80007},{"id":3537,"verdi":"389","beskrivelse":"Zambia","oId":80007},{"id":3538,"verdi":"326","beskrivelse":"Zimbabwe","oId":80007},{"id":3539,"verdi":"336","beskrivelse":"Senegal","oId":80007},{"id":3540,"verdi":"346","beskrivelse":"Somalia","oId":80007},{"id":3541,"verdi":"333","beskrivelse":"Sao Tome og Principe","oId":80007},{"id":3542,"verdi":"357","beskrivelse":"Swaziland","oId":80007},{"id":3543,"verdi":"373","beskrivelse":"Tchad","oId":80007},{"id":3544,"verdi":"376","beskrivelse":"Togo","oId":80007},{"id":3545,"verdi":"309","beskrivelse":"Niger","oId":80007},{"id":3546,"verdi":"313","beskrivelse":"Nigeria","oId":80007},{"id":3547,"verdi":"329","beskrivelse":"Rwanda","oId":80007},{"id":3548,"verdi":"338","beskrivelse":"Seychellene","oId":80007},{"id":3549,"verdi":"356","beskrivelse":"Sudan","oId":80007},{"id":3550,"verdi":"339","beskrivelse":"Sierra Leone","oId":80007},{"id":3551,"verdi":"299","beskrivelse":"Mali","oId":80007},{"id":3552,"verdi":"306","beskrivelse":"Mauretania","oId":80007},{"id":3553,"verdi":"307","beskrivelse":"Mauritius","oId":80007},{"id":3554,"verdi":"296","beskrivelse":"Malawi","oId":80007},{"id":3555,"verdi":"319","beskrivelse":"Mosambik","oId":80007},{"id":3556,"verdi":"308","beskrivelse":"Namibia","oId":80007},{"id":3557,"verdi":"220","beskrivelse":"Comorene","oId":80007},{"id":3558,"verdi":"283","beskrivelse":"Liberia","oId":80007},{"id":3559,"verdi":"281","beskrivelse":"Lesotho","oId":80007},{"id":3560,"verdi":"286","beskrivelse":"Libya","oId":80007},{"id":3561,"verdi":"303","beskrivelse":"Marokko","oId":80007},{"id":3562,"verdi":"289","beskrivelse":"Madagaskar","oId":80007},{"id":3563,"verdi":"260","beskrivelse":"Ghana","oId":80007},{"id":3564,"verdi":"256","beskrivelse":"Gambia","oId":80007},{"id":3565,"verdi":"264","beskrivelse":"Guinea","oId":80007},{"id":3566,"verdi":"235","beskrivelse":"Ekvatorial Guinea","oId":80007},{"id":3567,"verdi":"266","beskrivelse":"Guinea-Bissau","oId":80007},{"id":3568,"verdi":"276","beskrivelse":"Kenya","oId":80007},{"id":3569,"verdi":"203","beskrivelse":"Algerie","oId":80007},{"id":3570,"verdi":"249","beskrivelse":"Egypt","oId":80007},{"id":3571,"verdi":"304","beskrivelse":"Vest Sahara","oId":80007},{"id":3572,"verdi":"241","beskrivelse":"Eritrea","oId":80007},{"id":3573,"verdi":"246","beskrivelse":"Etiopia","oId":80007},{"id":3574,"verdi":"254","beskrivelse":"Gabon","oId":80007},{"id":3575,"verdi":"337","beskrivelse":"Sentralafrikanske Republikk","oId":80007},{"id":3576,"verdi":"278","beskrivelse":"Kongo-Brazzaville","oId":80007},{"id":3577,"verdi":"239","beskrivelse":"Elfenbenskysten","oId":80007},{"id":3578,"verdi":"270","beskrivelse":"Kamerun","oId":80007},{"id":3579,"verdi":"273","beskrivelse":"Kapp Verde","oId":80007},{"id":3580,"verdi":"250","beskrivelse":"Djibouti","oId":80007},{"id":3581,"verdi":"426","beskrivelse":"Forente Arabiske Emirater","oId":80007},{"id":3582,"verdi":"404","beskrivelse":"Afghanistan","oId":80007},{"id":3583,"verdi":"410","beskrivelse":"Bangladesh","oId":80007},{"id":3584,"verdi":"409","beskrivelse":"Bahrain","oId":80007},{"id":3585,"verdi":"416","beskrivelse":"Brunei Darussalam","oId":80007},{"id":3586,"verdi":"412","beskrivelse":"Bhutan","oId":80007},{"id":3587,"verdi":"554","beskrivelse":"Usbekistan","oId":80007},{"id":3588,"verdi":"575","beskrivelse":"Vietnam","oId":80007},{"id":3589,"verdi":"578","beskrivelse":"Jemen","oId":80007},{"id":3590,"verdi":"564","beskrivelse":"Syria","oId":80007},{"id":3591,"verdi":"568","beskrivelse":"Thailand","oId":80007},{"id":3592,"verdi":"550","beskrivelse":"Tadsjikistan","oId":80007},{"id":3593,"verdi":"552","beskrivelse":"Turkmenistan","oId":80007},{"id":3594,"verdi":"537","beskrivelse":"Øst-Timor","oId":80007},{"id":3595,"verdi":"432","beskrivelse":"Taiwan","oId":80007},{"id":3596,"verdi":"428","beskrivelse":"Filippinene","oId":80007},{"id":3597,"verdi":"534","beskrivelse":"Pakistan","oId":80007},{"id":3598,"verdi":"524","beskrivelse":"Palestina","oId":80007},{"id":3599,"verdi":"540","beskrivelse":"Qatar","oId":80007},{"id":3600,"verdi":"544","beskrivelse":"Saudi-Arabia","oId":80007},{"id":3601,"verdi":"548","beskrivelse":"Singapore","oId":80007},{"id":3602,"verdi":"516","beskrivelse":"Mongolia","oId":80007},{"id":3603,"verdi":"513","beskrivelse":"Maldivene","oId":80007},{"id":3604,"verdi":"512","beskrivelse":"Malaysia","oId":80007},{"id":3605,"verdi":"528","beskrivelse":"Nepal","oId":80007},{"id":3606,"verdi":"520","beskrivelse":"Oman","oId":80007},{"id":3607,"verdi":"827","beskrivelse":"Papua Ny-Guinea","oId":80007},{"id":3608,"verdi":"492","beskrivelse":"Sør-Korea","oId":80007},{"id":3609,"verdi":"496","beskrivelse":"Kuwait","oId":80007},{"id":3610,"verdi":"504","beskrivelse":"Laos","oId":80007},{"id":3611,"verdi":"508","beskrivelse":"Libanon","oId":80007},{"id":3612,"verdi":"424","beskrivelse":"Sri Lanka","oId":80007},{"id":3613,"verdi":"420","beskrivelse":"Myanmar","oId":80007},{"id":3614,"verdi":"456","beskrivelse":"Iran","oId":80007},{"id":3615,"verdi":"476","beskrivelse":"Jordan","oId":80007},{"id":3616,"verdi":"464","beskrivelse":"Japan","oId":80007},{"id":3617,"verdi":"502","beskrivelse":"Kirgisistan","oId":80007},{"id":3618,"verdi":"478","beskrivelse":"Kambodsja","oId":80007},{"id":3619,"verdi":"488","beskrivelse":"Nord-Korea","oId":80007},{"id":3620,"verdi":"484","beskrivelse":"Kina","oId":80007},{"id":3621,"verdi":"436","beskrivelse":"Hongkong","oId":80007},{"id":3622,"verdi":"448","beskrivelse":"Indonesia","oId":80007},{"id":3623,"verdi":"460","beskrivelse":"Israel","oId":80007},{"id":3624,"verdi":"444","beskrivelse":"India","oId":80007},{"id":3625,"verdi":"452","beskrivelse":"Irak","oId":80007},{"id":3626,"verdi":"111","beskrivelse":"Albania","oId":80007},{"id":3627,"verdi":"406","beskrivelse":"Armenia","oId":80007},{"id":3628,"verdi":"153","beskrivelse":"Østerrike","oId":80007},{"id":3629,"verdi":"407","beskrivelse":"Aserbajdsjan","oId":80007},{"id":3630,"verdi":"155","beskrivelse":"Bosnia-Hercegovina","oId":80007},{"id":3631,"verdi":"112","beskrivelse":"Belgia","oId":80007},{"id":3632,"verdi":"510","beskrivelse":"Montenegro","oId":80007},{"id":3633,"verdi":"125","beskrivelse":"Jugoslavia","oId":80007},{"id":3635,"verdi":"160","beskrivelse":"Kosovo","oId":80007},{"id":3636,"verdi":"161","beskrivelse":"Andorra","oId":80007},{"id":3637,"verdi":"106","beskrivelse":"Sverige","oId":80007},{"id":3638,"verdi":"146","beskrivelse":"Slovenia","oId":80007},{"id":3639,"verdi":"157","beskrivelse":"Slovakia","oId":80007},{"id":3640,"verdi":"143","beskrivelse":"Tyrkia","oId":80007},{"id":3641,"verdi":"148","beskrivelse":"Ukraina","oId":80007},{"id":3642,"verdi":"159","beskrivelse":"Serbia","oId":80007},{"id":3643,"verdi":"127","beskrivelse":"Nederland","oId":80007},{"id":3644,"verdi":"100","beskrivelse":"Norge","oId":80007},{"id":3645,"verdi":"131","beskrivelse":"Polen","oId":80007},{"id":3646,"verdi":"132","beskrivelse":"Portugal","oId":80007},{"id":3647,"verdi":"133","beskrivelse":"Romania","oId":80007},{"id":3648,"verdi":"140","beskrivelse":"Russland","oId":80007},{"id":3649,"verdi":"129","beskrivelse":"Luxembourg","oId":80007},{"id":3650,"verdi":"124","beskrivelse":"Latvia","oId":80007},{"id":3651,"verdi":"130","beskrivelse":"Monaco","oId":80007},{"id":3652,"verdi":"138","beskrivelse":"Moldova","oId":80007},{"id":3653,"verdi":"156","beskrivelse":"Makedonia","oId":80007},{"id":3654,"verdi":"126","beskrivelse":"Malta","oId":80007},{"id":3655,"verdi":"121","beskrivelse":"Irland","oId":80007},{"id":3656,"verdi":"105","beskrivelse":"Island","oId":80007},{"id":3657,"verdi":"123","beskrivelse":"Italia","oId":80007},{"id":3658,"verdi":"480","beskrivelse":"Kasahkstan","oId":80007},{"id":3659,"verdi":"128","beskrivelse":"Liechtenstein","oId":80007},{"id":3660,"verdi":"136","beskrivelse":"Litauen","oId":80007},{"id":3661,"verdi":"139","beskrivelse":"Storbritannia","oId":80007},{"id":3662,"verdi":"430","beskrivelse":"Georgia","oId":80007},{"id":3663,"verdi":"102","beskrivelse":"Grønland","oId":80007},{"id":3664,"verdi":"119","beskrivelse":"Hellas","oId":80007},{"id":3665,"verdi":"122","beskrivelse":"Kroatia","oId":80007},{"id":3666,"verdi":"152","beskrivelse":"Ungarn","oId":80007},{"id":3667,"verdi":"101","beskrivelse":"Danmark","oId":80007},{"id":3668,"verdi":"115","beskrivelse":"Estland","oId":80007},{"id":3669,"verdi":"137","beskrivelse":"Spania","oId":80007},{"id":3670,"verdi":"103","beskrivelse":"Finland","oId":80007},{"id":3671,"verdi":"104","beskrivelse":"Færøyene","oId":80007},{"id":3672,"verdi":"117","beskrivelse":"Frankrike","oId":80007},{"id":3673,"verdi":"113","beskrivelse":"Bulgaria","oId":80007},{"id":3674,"verdi":"120","beskrivelse":"Hviterussland","oId":80007},{"id":3675,"verdi":"141","beskrivelse":"Sveits","oId":80007},{"id":3676,"verdi":"500","beskrivelse":"Kypros","oId":80007},{"id":3677,"verdi":"158","beskrivelse":"Tsjekkia","oId":80007},{"id":3678,"verdi":"144","beskrivelse":"Tyskland","oId":80007},{"id":3679,"verdi":"606","beskrivelse":"Bermuda","oId":80007},{"id":3680,"verdi":"612","beskrivelse":"Canada","oId":80007},{"id":3681,"verdi":"652","beskrivelse":"Mexico","oId":80007},{"id":3682,"verdi":"684","beskrivelse":"USA","oId":80007},{"id":3683,"verdi":"805","beskrivelse":"Australia","oId":80007},{"id":3684,"verdi":"811","beskrivelse":"Fiji","oId":80007},{"id":3685,"verdi":"817","beskrivelse":"Guam","oId":80007},{"id":3686,"verdi":"818","beskrivelse":"Nauru","oId":80007},{"id":3687,"verdi":"820","beskrivelse":"Ny Zealand","oId":80007},{"id":3688,"verdi":"813","beskrivelse":"Tonga","oId":80007},{"id":3689,"verdi":"812","beskrivelse":"Vanuatu","oId":80007},{"id":3690,"verdi":"830","beskrivelse":"Samoa","oId":80007},{"id":3691,"verdi":"656","beskrivelse":"Nederlandske Antiller","oId":80007},{"id":3692,"verdi":"705","beskrivelse":"Argentina","oId":80007},{"id":3693,"verdi":"602","beskrivelse":"Barbados","oId":80007},{"id":3694,"verdi":"710","beskrivelse":"Bolivia","oId":80007},{"id":3695,"verdi":"715","beskrivelse":"Brasil","oId":80007},{"id":3696,"verdi":"605","beskrivelse":"Bahamas","oId":80007},{"id":3697,"verdi":"607","beskrivelse":"Antigua og Barbuda","oId":80007},{"id":3698,"verdi":"831","beskrivelse":"St. Lucia","oId":80007},{"id":3699,"verdi":"755","beskrivelse":"Paraguay","oId":80007},{"id":3700,"verdi":"765","beskrivelse":"Surinam","oId":80007},{"id":3701,"verdi":"672","beskrivelse":"El Salvador","oId":80007},{"id":3702,"verdi":"680","beskrivelse":"Trinidad og Tobago","oId":80007},{"id":3703,"verdi":"770","beskrivelse":"Uruguay","oId":80007},{"id":3704,"verdi":"775","beskrivelse":"Venezuela","oId":80007},{"id":3705,"verdi":"636","beskrivelse":"Haiti","oId":80007},{"id":3706,"verdi":"648","beskrivelse":"Jamaica","oId":80007},{"id":3707,"verdi":"664","beskrivelse":"Nicaragua","oId":80007},{"id":3708,"verdi":"668","beskrivelse":"Panama","oId":80007},{"id":3709,"verdi":"760","beskrivelse":"Peru","oId":80007},{"id":3710,"verdi":"685","beskrivelse":"Puerto Rico","oId":80007},{"id":3711,"verdi":"735","beskrivelse":"Ecuador","oId":80007},{"id":3712,"verdi":"740","beskrivelse":"Falklandsøyene","oId":80007},{"id":3713,"verdi":"745","beskrivelse":"Fransk Guyana","oId":80007},{"id":3714,"verdi":"632","beskrivelse":"Guatemala","oId":80007},{"id":3715,"verdi":"720","beskrivelse":"Guyana","oId":80007},{"id":3716,"verdi":"644","beskrivelse":"Honduras","oId":80007},{"id":3717,"verdi":"604","beskrivelse":"Belize","oId":80007},{"id":3718,"verdi":"725","beskrivelse":"Chile","oId":80007},{"id":3719,"verdi":"730","beskrivelse":"Colombia","oId":80007},{"id":3720,"verdi":"616","beskrivelse":"Costa Rica","oId":80007},{"id":3721,"verdi":"620","beskrivelse":"Cuba","oId":80007},{"id":3722,"verdi":"624","beskrivelse":"Dominikanske Republikk","oId":80007}];

        var kommunerOgBydeler = [{"id":2934,"verdi":"030101","beskrivelse":"Gamle Oslo","oId":80021},{"id":2936,"verdi":"030102","beskrivelse":"Grünerløkka","oId":80021},{"id":2938,"verdi":"030103","beskrivelse":"Sagene","oId":80021},{"id":2946,"verdi":"030116","beskrivelse":"Oslo Sentrum","oId":80021},{"id":2948,"verdi":"030117","beskrivelse":"Oslo Marka","oId":80021},{"id":2952,"verdi":"030113","beskrivelse":"Østensjø","oId":80021},{"id":2954,"verdi":"030114","beskrivelse":"Nordstrand","oId":80021},{"id":2956,"verdi":"030115","beskrivelse":"Søndre Nordstrand","oId":80021},{"id":2958,"verdi":"030110","beskrivelse":"Grorud","oId":80021},{"id":2960,"verdi":"030111","beskrivelse":"Stovner","oId":80021},{"id":2962,"verdi":"030112","beskrivelse":"Alna","oId":80021},{"id":2964,"verdi":"030107","beskrivelse":"Vestre Aker","oId":80021},{"id":2966,"verdi":"030108","beskrivelse":"Nordre Aker","oId":80021},{"id":2968,"verdi":"030109","beskrivelse":"Bjerke","oId":80021},{"id":2970,"verdi":"030104","beskrivelse":"St.Hanshaugen","oId":80021},{"id":2972,"verdi":"030105","beskrivelse":"Frogner","oId":80021},{"id":2974,"verdi":"030106","beskrivelse":"Ullern","oId":80021},{"id":3018,"verdi":"1101","beskrivelse":"Eigersund","oId":80006},{"id":3020,"verdi":"1103","beskrivelse":"Stavanger","oId":80006},{"id":3021,"verdi":"1106","beskrivelse":"Haugesund","oId":80006},{"id":3022,"verdi":"1111","beskrivelse":"Sokndal","oId":80006},{"id":3023,"verdi":"1112","beskrivelse":"Lund","oId":80006},{"id":3024,"verdi":"1151","beskrivelse":"Utsira","oId":80006},{"id":3027,"verdi":"1160","beskrivelse":"Vindafjord","oId":80006},{"id":3030,"verdi":"1144","beskrivelse":"Kvitsøy","oId":80006},{"id":3031,"verdi":"1145","beskrivelse":"Bokn","oId":80006},{"id":3032,"verdi":"1146","beskrivelse":"Tysvær","oId":80006},{"id":3033,"verdi":"1149","beskrivelse":"Karmøy","oId":80006},{"id":3034,"verdi":"1127","beskrivelse":"Randaberg","oId":80006},{"id":3036,"verdi":"1130","beskrivelse":"Strand","oId":80006},{"id":3037,"verdi":"1133","beskrivelse":"Hjelmeland","oId":80006},{"id":3038,"verdi":"1134","beskrivelse":"Suldal","oId":80006},{"id":3039,"verdi":"1135","beskrivelse":"Sauda","oId":80006},{"id":3040,"verdi":"1114","beskrivelse":"Bjerkreim","oId":80006},{"id":3041,"verdi":"1119","beskrivelse":"Hå","oId":80006},{"id":3042,"verdi":"1120","beskrivelse":"Klepp","oId":80006},{"id":3043,"verdi":"1121","beskrivelse":"Time","oId":80006},{"id":3044,"verdi":"1122","beskrivelse":"Gjesdal","oId":80006},{"id":3045,"verdi":"1124","beskrivelse":"Sola","oId":80006},{"id":3089,"verdi":"0301","beskrivelse":"Oslo","oId":80006},{"id":3109,"verdi":"5001","beskrivelse":"Trondheim","oId":80006},{"id":3112,"verdi":"5054","beskrivelse":"Indre Fosen","oId":80006},{"id":3115,"verdi":"5049","beskrivelse":"Flatanger","oId":80006},{"id":3118,"verdi":"5052","beskrivelse":"Leka","oId":80006},{"id":3119,"verdi":"5053","beskrivelse":"Inferøy","oId":80006},{"id":3120,"verdi":"5043","beskrivelse":"Røyrvik","oId":80006},{"id":3121,"verdi":"5044","beskrivelse":"Namsskogan","oId":80006},{"id":3122,"verdi":"5045","beskrivelse":"Grong","oId":80006},{"id":3123,"verdi":"5046","beskrivelse":"Høylandet","oId":80006},{"id":3124,"verdi":"5047","beskrivelse":"Overhalla","oId":80006},{"id":3126,"verdi":"5037","beskrivelse":"Levanger","oId":80006},{"id":3127,"verdi":"5038","beskrivelse":"Verdal","oId":80006},{"id":3130,"verdi":"5041","beskrivelse":"Snåsa","oId":80006},{"id":3131,"verdi":"5042","beskrivelse":"Lierne","oId":80006},{"id":3132,"verdi":"5031","beskrivelse":"Malvik","oId":80006},{"id":3133,"verdi":"5032","beskrivelse":"Selbu","oId":80006},{"id":3134,"verdi":"5033","beskrivelse":"Tydal","oId":80006},{"id":3135,"verdi":"5034","beskrivelse":"Meråker","oId":80006},{"id":3136,"verdi":"5035","beskrivelse":"Stjørdal","oId":80006},{"id":3137,"verdi":"5036","beskrivelse":"Frosta","oId":80006},{"id":3138,"verdi":"5025","beskrivelse":"Røros","oId":80006},{"id":3139,"verdi":"5026","beskrivelse":"Holtålen","oId":80006},{"id":3140,"verdi":"5027","beskrivelse":"Midtre Gauldal","oId":80006},{"id":3141,"verdi":"5028","beskrivelse":"Melhus","oId":80006},{"id":3142,"verdi":"5029","beskrivelse":"Skaun","oId":80006},{"id":3145,"verdi":"5020","beskrivelse":"Osen","oId":80006},{"id":3146,"verdi":"5021","beskrivelse":"Oppdal","oId":80006},{"id":3147,"verdi":"5022","beskrivelse":"Rennebu","oId":80006},{"id":3151,"verdi":"5014","beskrivelse":"Frøya","oId":80006},{"id":3156,"verdi":"2110","beskrivelse":"Svalbard","oId":80006},{"id":3157,"verdi":"2121","beskrivelse":"Bjørnøya","oId":80006},{"id":3158,"verdi":"2131","beskrivelse":"Hopen","oId":80006},{"id":3159,"verdi":"2211","beskrivelse":"Jan Mayen","oId":80006},{"id":3160,"verdi":"2310","beskrivelse":"Kontinentalsokkelen","oId":80006},{"id":3161,"verdi":"2311","beskrivelse":"Sokkelen sør for 62 grader","oId":80006},{"id":3162,"verdi":"2321","beskrivelse":"Sokkelen nord for 62 grader","oId":80006},{"id":3163,"verdi":"2111","beskrivelse":"Spitsbergen","oId":80006},{"id":3164,"verdi":"2100","beskrivelse":"Norge div","oId":80006},{"id":3165,"verdi":"9999","beskrivelse":"Ukjent kommune","oId":80006},{"id":3332,"verdi":"1505","beskrivelse":"Kristiansund","oId":80006},{"id":3334,"verdi":"1511","beskrivelse":"Vanylven","oId":80006},{"id":3335,"verdi":"1514","beskrivelse":"Sande i M og R","oId":80006},{"id":3336,"verdi":"1515","beskrivelse":"Herøy i M og R","oId":80006},{"id":3338,"verdi":"1573","beskrivelse":"Smøla","oId":80006},{"id":3339,"verdi":"1576","beskrivelse":"Aure","oId":80006},{"id":3340,"verdi":"1560","beskrivelse":"Tingvoll","oId":80006},{"id":3341,"verdi":"1563","beskrivelse":"Sunndal","oId":80006},{"id":3342,"verdi":"1566","beskrivelse":"Surnadal","oId":80006},{"id":3346,"verdi":"1547","beskrivelse":"Aukra","oId":80006},{"id":3349,"verdi":"1554","beskrivelse":"Averøy","oId":80006},{"id":3351,"verdi":"1557","beskrivelse":"Gjemnes","oId":80006},{"id":3353,"verdi":"1535","beskrivelse":"Vestnes","oId":80006},{"id":3354,"verdi":"1539","beskrivelse":"Rauma","oId":80006},{"id":3358,"verdi":"1525","beskrivelse":"Stranda","oId":80006},{"id":3360,"verdi":"1528","beskrivelse":"Sykkylven","oId":80006},{"id":3362,"verdi":"1531","beskrivelse":"Sula","oId":80006},{"id":3363,"verdi":"1532","beskrivelse":"Giske","oId":80006},{"id":3364,"verdi":"1516","beskrivelse":"Ulstein","oId":80006},{"id":3365,"verdi":"1517","beskrivelse":"Hareid","oId":80006},{"id":3367,"verdi":"1520","beskrivelse":"Ørsta","oId":80006},{"id":3420,"verdi":"1804","beskrivelse":"Bodø","oId":80006},{"id":3422,"verdi":"1811","beskrivelse":"Bindal","oId":80006},{"id":3423,"verdi":"1812","beskrivelse":"Sømna","oId":80006},{"id":3424,"verdi":"1813","beskrivelse":"Brønnøy","oId":80006},{"id":3425,"verdi":"1815","beskrivelse":"Vega","oId":80006},{"id":3426,"verdi":"1870","beskrivelse":"Sortland","oId":80006},{"id":3427,"verdi":"1871","beskrivelse":"Andøy","oId":80006},{"id":3428,"verdi":"1874","beskrivelse":"Moskenes","oId":80006},{"id":3429,"verdi":"1859","beskrivelse":"Flakstad","oId":80006},{"id":3430,"verdi":"1860","beskrivelse":"Vestvågøy","oId":80006},{"id":3431,"verdi":"1865","beskrivelse":"Vågan","oId":80006},{"id":3432,"verdi":"1866","beskrivelse":"Hadsel","oId":80006},{"id":3433,"verdi":"1867","beskrivelse":"Bø i Vesterålen","oId":80006},{"id":3434,"verdi":"1868","beskrivelse":"Øksnes","oId":80006},{"id":3435,"verdi":"1851","beskrivelse":"Lødingen","oId":80006},{"id":3437,"verdi":"1853","beskrivelse":"Evenes","oId":80006},{"id":3439,"verdi":"1856","beskrivelse":"Røst","oId":80006},{"id":3440,"verdi":"1857","beskrivelse":"Værøy","oId":80006},{"id":3441,"verdi":"1841","beskrivelse":"Fauske","oId":80006},{"id":3442,"verdi":"1842","beskrivelse":"Skjerstad","oId":80006},{"id":3443,"verdi":"1845","beskrivelse":"Sørfold","oId":80006},{"id":3444,"verdi":"1848","beskrivelse":"Steigen","oId":80006},{"id":3447,"verdi":"1835","beskrivelse":"Træna","oId":80006},{"id":3448,"verdi":"1836","beskrivelse":"Rødøy","oId":80006},{"id":3449,"verdi":"1837","beskrivelse":"Meløy","oId":80006},{"id":3450,"verdi":"1838","beskrivelse":"Gildeskål","oId":80006},{"id":3451,"verdi":"1839","beskrivelse":"Beiarn","oId":80006},{"id":3452,"verdi":"1840","beskrivelse":"Saltdal","oId":80006},{"id":3453,"verdi":"1826","beskrivelse":"Hattfjelldal","oId":80006},{"id":3454,"verdi":"1827","beskrivelse":"Dønna","oId":80006},{"id":3455,"verdi":"1828","beskrivelse":"Nesna","oId":80006},{"id":3456,"verdi":"1832","beskrivelse":"Hemnes","oId":80006},{"id":3457,"verdi":"1833","beskrivelse":"Rana","oId":80006},{"id":3458,"verdi":"1834","beskrivelse":"Lurøy","oId":80006},{"id":3459,"verdi":"1816","beskrivelse":"Vevelstad","oId":80006},{"id":3460,"verdi":"1818","beskrivelse":"Herøy i Nordland","oId":80006},{"id":3461,"verdi":"1820","beskrivelse":"Alstahaug","oId":80006},{"id":3462,"verdi":"1822","beskrivelse":"Leirfjord","oId":80006},{"id":3463,"verdi":"1824","beskrivelse":"Vefsn","oId":80006},{"id":3464,"verdi":"1825","beskrivelse":"Grane","oId":80006},{"id":4479,"verdi":"5061","beskrivelse":"Rindal","oId":80006},{"id":4490,"verdi":"4640","beskrivelse":"SOGNDAL","oId":80006},{"id":4491,"verdi":"4649","beskrivelse":"STAD","oId":80006},{"id":4492,"verdi":"4626","beskrivelse":"ØYGARDEN","oId":80006},{"id":4493,"verdi":"4602","beskrivelse":"KINN","oId":80006},{"id":4494,"verdi":"4624","beskrivelse":"BJØRNAFJORDEN","oId":80006},{"id":4495,"verdi":"4601","beskrivelse":"BERGEN","oId":80006},{"id":4496,"verdi":"1108","beskrivelse":"SANDNES","oId":80006},{"id":4497,"verdi":"4611","beskrivelse":"ETNE","oId":80006},{"id":4498,"verdi":"4612","beskrivelse":"SVEIO","oId":80006},{"id":4499,"verdi":"1506","beskrivelse":"MOLDE","oId":80006},{"id":4500,"verdi":"4225","beskrivelse":"LYNGDAL","oId":80006},{"id":4501,"verdi":"4613","beskrivelse":"BØMLO","oId":80006},{"id":4502,"verdi":"1507","beskrivelse":"ÅLESUND","oId":80006},{"id":4503,"verdi":"4614","beskrivelse":"STORD","oId":80006},{"id":4504,"verdi":"1577","beskrivelse":"VOLDA","oId":80006},{"id":4505,"verdi":"3817","beskrivelse":"MIDT-TELEMARK","oId":80006},{"id":4506,"verdi":"1578","beskrivelse":"FJORD","oId":80006},{"id":4507,"verdi":"4615","beskrivelse":"FITJAR","oId":80006},{"id":4508,"verdi":"1579","beskrivelse":"HUSTADVIKA","oId":80006},{"id":4509,"verdi":"4205","beskrivelse":"LINDESNES","oId":80006},{"id":4510,"verdi":"1806","beskrivelse":"NARVIK","oId":80006},{"id":4511,"verdi":"4616","beskrivelse":"TYSNES","oId":80006},{"id":4512,"verdi":"4617","beskrivelse":"KVINNHERAD","oId":80006},{"id":4513,"verdi":"1875","beskrivelse":"HAMARØY","oId":80006},{"id":4514,"verdi":"4618","beskrivelse":"ULLENSVANG","oId":80006},{"id":4515,"verdi":"3001","beskrivelse":"HALDEN","oId":80006},{"id":4516,"verdi":"3002","beskrivelse":"MOSS","oId":80006},{"id":4517,"verdi":"4619","beskrivelse":"EIDFJORD","oId":80006},{"id":4518,"verdi":"3401","beskrivelse":"KONGSVINGER","oId":80006},{"id":4519,"verdi":"3003","beskrivelse":"SARPSBORG","oId":80006},{"id":4520,"verdi":"4620","beskrivelse":"ULVIK","oId":80006},{"id":4521,"verdi":"3004","beskrivelse":"FREDRIKSTAD","oId":80006},{"id":4522,"verdi":"3403","beskrivelse":"HAMAR","oId":80006},{"id":4523,"verdi":"4621","beskrivelse":"VOSS","oId":80006},{"id":4524,"verdi":"3005","beskrivelse":"DRAMMEN","oId":80006},{"id":4525,"verdi":"3405","beskrivelse":"LILLEHAMMER","oId":80006},{"id":4526,"verdi":"3006","beskrivelse":"KONGSBERG","oId":80006},{"id":4527,"verdi":"4622","beskrivelse":"KVAM","oId":80006},{"id":4528,"verdi":"3407","beskrivelse":"GJØVIK","oId":80006},{"id":4529,"verdi":"4623","beskrivelse":"SAMNANGER","oId":80006},{"id":4530,"verdi":"3007","beskrivelse":"RINGERIKE","oId":80006},{"id":4531,"verdi":"3011","beskrivelse":"HVALER","oId":80006},{"id":4532,"verdi":"4625","beskrivelse":"AUSTEVOLL","oId":80006},{"id":4533,"verdi":"3411","beskrivelse":"RINGSAKER","oId":80006},{"id":4534,"verdi":"3012","beskrivelse":"AREMARK","oId":80006},{"id":4535,"verdi":"4627","beskrivelse":"ASKØY","oId":80006},{"id":4536,"verdi":"3013","beskrivelse":"MARKER","oId":80006},{"id":4537,"verdi":"3412","beskrivelse":"LØTEN","oId":80006},{"id":4538,"verdi":"3014","beskrivelse":"INDRE ØSTFOLD","oId":80006},{"id":4539,"verdi":"4628","beskrivelse":"VAKSDAL","oId":80006},{"id":4540,"verdi":"3413","beskrivelse":"STANGE","oId":80006},{"id":4541,"verdi":"3015","beskrivelse":"SKIPTVET","oId":80006},{"id":4542,"verdi":"3016","beskrivelse":"RAKKESTAD","oId":80006},{"id":4543,"verdi":"3017","beskrivelse":"RÅDE","oId":80006},{"id":4544,"verdi":"4629","beskrivelse":"MODALEN","oId":80006},{"id":4545,"verdi":"4630","beskrivelse":"OSTERØY","oId":80006},{"id":4546,"verdi":"3018","beskrivelse":"VÅLER (VIKEN)","oId":80006},{"id":4547,"verdi":"4631","beskrivelse":"ALVER","oId":80006},{"id":4548,"verdi":"3019","beskrivelse":"VESTBY","oId":80006},{"id":4549,"verdi":"3020","beskrivelse":"NORDRE FOLLO","oId":80006},{"id":4550,"verdi":"3414","beskrivelse":"NORD-ODAL","oId":80006},{"id":4551,"verdi":"4632","beskrivelse":"AUSTRHEIM","oId":80006},{"id":4552,"verdi":"3415","beskrivelse":"SØR-ODAL","oId":80006},{"id":4553,"verdi":"3021","beskrivelse":"ÅS","oId":80006},{"id":4554,"verdi":"4633","beskrivelse":"FEDJE","oId":80006},{"id":4555,"verdi":"3022","beskrivelse":"FROGN","oId":80006},{"id":4556,"verdi":"3416","beskrivelse":"EIDSKOG","oId":80006},{"id":4557,"verdi":"3023","beskrivelse":"NESODDEN","oId":80006},{"id":4558,"verdi":"4634","beskrivelse":"MASFJORDEN","oId":80006},{"id":4559,"verdi":"3417","beskrivelse":"GRUE","oId":80006},{"id":4560,"verdi":"4635","beskrivelse":"GULEN","oId":80006},{"id":4561,"verdi":"3024","beskrivelse":"BÆRUM","oId":80006},{"id":4562,"verdi":"3025","beskrivelse":"ASKER","oId":80006},{"id":4563,"verdi":"3418","beskrivelse":"ÅSNES","oId":80006},{"id":4564,"verdi":"3026","beskrivelse":"AURSKOG-HØLAND","oId":80006},{"id":4565,"verdi":"3027","beskrivelse":"RÆLINGEN","oId":80006},{"id":4566,"verdi":"3419","beskrivelse":"VÅLER (INNLANDET)","oId":80006},{"id":4567,"verdi":"4636","beskrivelse":"SOLUND","oId":80006},{"id":4568,"verdi":"3028","beskrivelse":"ENEBAKK","oId":80006},{"id":4569,"verdi":"4637","beskrivelse":"HYLLESTAD","oId":80006},{"id":4570,"verdi":"3420","beskrivelse":"ELVERUM","oId":80006},{"id":4571,"verdi":"3029","beskrivelse":"LØRENSKOG","oId":80006},{"id":4572,"verdi":"4638","beskrivelse":"HØYANGER","oId":80006},{"id":4573,"verdi":"3030","beskrivelse":"LILLESTRØM","oId":80006},{"id":4574,"verdi":"3421","beskrivelse":"TRYSIL","oId":80006},{"id":4575,"verdi":"3031","beskrivelse":"NITTEDAL","oId":80006},{"id":4576,"verdi":"4639","beskrivelse":"VIK","oId":80006},{"id":4577,"verdi":"3422","beskrivelse":"ÅMOT","oId":80006},{"id":4578,"verdi":"3032","beskrivelse":"GJERDRUM","oId":80006},{"id":4579,"verdi":"4641","beskrivelse":"AURLAND","oId":80006},{"id":4580,"verdi":"3423","beskrivelse":"STOR-ELVDAL","oId":80006},{"id":4581,"verdi":"3424","beskrivelse":"RENDALEN","oId":80006},{"id":4582,"verdi":"4642","beskrivelse":"LÆRDAL","oId":80006},{"id":4583,"verdi":"3425","beskrivelse":"ENGERDAL","oId":80006},{"id":4584,"verdi":"4643","beskrivelse":"ÅRDAL","oId":80006},{"id":4585,"verdi":"3426","beskrivelse":"TOLGA","oId":80006},{"id":4586,"verdi":"4644","beskrivelse":"LUSTER","oId":80006},{"id":4587,"verdi":"3427","beskrivelse":"TYNSET","oId":80006},{"id":4588,"verdi":"3033","beskrivelse":"ULLENSAKER","oId":80006},{"id":4589,"verdi":"3034","beskrivelse":"NES","oId":80006},{"id":4590,"verdi":"4645","beskrivelse":"ASKVOLL","oId":80006},{"id":4591,"verdi":"3428","beskrivelse":"ALVDAL","oId":80006},{"id":4592,"verdi":"3035","beskrivelse":"EIDSVOLL","oId":80006},{"id":4593,"verdi":"3036","beskrivelse":"NANNESTAD","oId":80006},{"id":4594,"verdi":"3037","beskrivelse":"HURDAL","oId":80006},{"id":4595,"verdi":"4646","beskrivelse":"FJALER","oId":80006},{"id":4596,"verdi":"3038","beskrivelse":"HOLE","oId":80006},{"id":4597,"verdi":"3429","beskrivelse":"FOLLDAL","oId":80006},{"id":4598,"verdi":"4647","beskrivelse":"SUNNFJORD","oId":80006},{"id":4599,"verdi":"3039","beskrivelse":"FLÅ","oId":80006},{"id":4600,"verdi":"3040","beskrivelse":"NESBYEN","oId":80006},{"id":4601,"verdi":"4648","beskrivelse":"BREMANGER","oId":80006},{"id":4602,"verdi":"3041","beskrivelse":"GOL","oId":80006},{"id":4603,"verdi":"3430","beskrivelse":"OS","oId":80006},{"id":4604,"verdi":"3042","beskrivelse":"HEMSEDAL","oId":80006},{"id":4605,"verdi":"4650","beskrivelse":"GLOPPEN","oId":80006},{"id":4606,"verdi":"3431","beskrivelse":"DOVRE","oId":80006},{"id":4607,"verdi":"3043","beskrivelse":"ÅL","oId":80006},{"id":4608,"verdi":"3432","beskrivelse":"LESJA","oId":80006},{"id":4609,"verdi":"4651","beskrivelse":"STRYN","oId":80006},{"id":4610,"verdi":"3044","beskrivelse":"HOL","oId":80006},{"id":4611,"verdi":"3045","beskrivelse":"SIGDAL","oId":80006},{"id":4612,"verdi":"3433","beskrivelse":"SKJÅK","oId":80006},{"id":4613,"verdi":"3046","beskrivelse":"KRØDSHERAD","oId":80006},{"id":4614,"verdi":"3434","beskrivelse":"LOM","oId":80006},{"id":4615,"verdi":"3047","beskrivelse":"MODUM","oId":80006},{"id":4616,"verdi":"3435","beskrivelse":"VÅGA","oId":80006},{"id":4617,"verdi":"3436","beskrivelse":"NORD-FRON","oId":80006},{"id":4618,"verdi":"3437","beskrivelse":"SEL","oId":80006},{"id":4619,"verdi":"3048","beskrivelse":"ØVRE EIKER","oId":80006},{"id":4620,"verdi":"3049","beskrivelse":"LIER","oId":80006},{"id":4621,"verdi":"3438","beskrivelse":"SØR-FRON","oId":80006},{"id":4622,"verdi":"3050","beskrivelse":"FLESBERG","oId":80006},{"id":4623,"verdi":"3051","beskrivelse":"ROLLAG","oId":80006},{"id":4624,"verdi":"3052","beskrivelse":"NORE OG UVDAL","oId":80006},{"id":4625,"verdi":"3439","beskrivelse":"RINGEBU","oId":80006},{"id":4626,"verdi":"3053","beskrivelse":"JEVNAKER","oId":80006},{"id":4627,"verdi":"3440","beskrivelse":"ØYER","oId":80006},{"id":4628,"verdi":"3054","beskrivelse":"LUNNER","oId":80006},{"id":4629,"verdi":"3441","beskrivelse":"GAUSDAL","oId":80006},{"id":4630,"verdi":"5401","beskrivelse":"TROMSØ","oId":80006},{"id":4631,"verdi":"3442","beskrivelse":"ØSTRE TOTEN","oId":80006},{"id":4632,"verdi":"3443","beskrivelse":"VESTRE TOTEN","oId":80006},{"id":4633,"verdi":"5402","beskrivelse":"HARSTAD","oId":80006},{"id":4634,"verdi":"3446","beskrivelse":"GRAN","oId":80006},{"id":4635,"verdi":"5403","beskrivelse":"ALTA","oId":80006},{"id":4636,"verdi":"5404","beskrivelse":"VARDØ","oId":80006},{"id":4637,"verdi":"5405","beskrivelse":"VADSØ","oId":80006},{"id":4638,"verdi":"3447","beskrivelse":"SØNDRE LAND","oId":80006},{"id":4639,"verdi":"5406","beskrivelse":"HAMMERFEST","oId":80006},{"id":4640,"verdi":"3448","beskrivelse":"NORDRE LAND","oId":80006},{"id":4641,"verdi":"5006","beskrivelse":"STEINKJER","oId":80006},{"id":4642,"verdi":"3449","beskrivelse":"SØR-AURDAL","oId":80006},{"id":4643,"verdi":"3450","beskrivelse":"ETNEDAL","oId":80006},{"id":4644,"verdi":"3451","beskrivelse":"NORD-AURDAL","oId":80006},{"id":4645,"verdi":"5007","beskrivelse":"NAMSOS","oId":80006},{"id":4646,"verdi":"5411","beskrivelse":"KVÆFJORD","oId":80006},{"id":4647,"verdi":"3452","beskrivelse":"VESTRE SLIDRE","oId":80006},{"id":4648,"verdi":"5412","beskrivelse":"TJELDSUND","oId":80006},{"id":4649,"verdi":"5055","beskrivelse":"HEIM","oId":80006},{"id":4650,"verdi":"5413","beskrivelse":"IBESTAD","oId":80006},{"id":4651,"verdi":"5414","beskrivelse":"GRATANGEN","oId":80006},{"id":4652,"verdi":"3453","beskrivelse":"ØYSTRE SLIDRE","oId":80006},{"id":4653,"verdi":"5056","beskrivelse":"HITRA","oId":80006},{"id":4654,"verdi":"5415","beskrivelse":"LAVANGEN","oId":80006},{"id":4655,"verdi":"3454","beskrivelse":"VANG","oId":80006},{"id":4656,"verdi":"5057","beskrivelse":"ØRLAND","oId":80006},{"id":4657,"verdi":"5416","beskrivelse":"BARDU","oId":80006},{"id":4658,"verdi":"5417","beskrivelse":"SALANGEN","oId":80006},{"id":4659,"verdi":"5058","beskrivelse":"ÅFJORD","oId":80006},{"id":4660,"verdi":"3801","beskrivelse":"HORTEN","oId":80006},{"id":4661,"verdi":"5418","beskrivelse":"MÅLSELV","oId":80006},{"id":4662,"verdi":"5419","beskrivelse":"SØRREISA","oId":80006},{"id":4663,"verdi":"5059","beskrivelse":"ORKLAND","oId":80006},{"id":4664,"verdi":"3802","beskrivelse":"HOLMESTRAND","oId":80006},{"id":4665,"verdi":"5420","beskrivelse":"DYRØY","oId":80006},{"id":4666,"verdi":"5421","beskrivelse":"SENJA","oId":80006},{"id":4667,"verdi":"5060","beskrivelse":"NÆRØYSUND","oId":80006},{"id":4668,"verdi":"5422","beskrivelse":"BALSFJORD","oId":80006},{"id":4669,"verdi":"3803","beskrivelse":"TØNSBERG","oId":80006},{"id":4670,"verdi":"5423","beskrivelse":"KARLSØY","oId":80006},{"id":4671,"verdi":"5424","beskrivelse":"LYNGEN","oId":80006},{"id":4672,"verdi":"3804","beskrivelse":"SANDEFJORD","oId":80006},{"id":4673,"verdi":"5425","beskrivelse":"STORFJORD","oId":80006},{"id":4674,"verdi":"5426","beskrivelse":"KÅFJORD","oId":80006},{"id":4675,"verdi":"3805","beskrivelse":"LARVIK","oId":80006},{"id":4676,"verdi":"4204","beskrivelse":"KRISTIANSAND","oId":80006},{"id":4677,"verdi":"5427","beskrivelse":"SKJERVØY","oId":80006},{"id":4678,"verdi":"4201","beskrivelse":"RISØR","oId":80006},{"id":4679,"verdi":"3806","beskrivelse":"PORSGRUNN","oId":80006},{"id":4680,"verdi":"5428","beskrivelse":"NORDREISA","oId":80006},{"id":4681,"verdi":"5429","beskrivelse":"KVÆNANGEN","oId":80006},{"id":4682,"verdi":"5430","beskrivelse":"KAUTOKEINO","oId":80006},{"id":4683,"verdi":"4202","beskrivelse":"GRIMSTAD","oId":80006},{"id":4684,"verdi":"3807","beskrivelse":"SKIEN","oId":80006},{"id":4685,"verdi":"5432","beskrivelse":"LOPPA","oId":80006},{"id":4686,"verdi":"4203","beskrivelse":"ARENDAL","oId":80006},{"id":4687,"verdi":"3808","beskrivelse":"NOTODDEN","oId":80006},{"id":4688,"verdi":"5433","beskrivelse":"HASVIK","oId":80006},{"id":4689,"verdi":"5434","beskrivelse":"MÅSØY","oId":80006},{"id":4690,"verdi":"3811","beskrivelse":"FÆRDER","oId":80006},{"id":4691,"verdi":"5435","beskrivelse":"NORDKAPP","oId":80006},{"id":4692,"verdi":"4206","beskrivelse":"FARSUND","oId":80006},{"id":4693,"verdi":"3812","beskrivelse":"SILJAN","oId":80006},{"id":4694,"verdi":"5436","beskrivelse":"PORSANGER","oId":80006},{"id":4695,"verdi":"4207","beskrivelse":"FLEKKEFJORD","oId":80006},{"id":4696,"verdi":"5437","beskrivelse":"KARASJOK","oId":80006},{"id":4697,"verdi":"3813","beskrivelse":"BAMBLE","oId":80006},{"id":4698,"verdi":"4211","beskrivelse":"GJERSTAD","oId":80006},{"id":4699,"verdi":"3814","beskrivelse":"KRAGERØ","oId":80006},{"id":4700,"verdi":"5438","beskrivelse":"LEBESBY","oId":80006},{"id":4701,"verdi":"4212","beskrivelse":"VEGÅRSHEI","oId":80006},{"id":4702,"verdi":"5439","beskrivelse":"GAMVIK","oId":80006},{"id":4703,"verdi":"3815","beskrivelse":"DRANGEDAL","oId":80006},{"id":4704,"verdi":"5440","beskrivelse":"BERLEVÅG","oId":80006},{"id":4705,"verdi":"4213","beskrivelse":"TVEDESTRAND","oId":80006},{"id":4706,"verdi":"3816","beskrivelse":"NOME","oId":80006},{"id":4707,"verdi":"5441","beskrivelse":"TANA","oId":80006},{"id":4708,"verdi":"4214","beskrivelse":"FROLAND","oId":80006},{"id":4709,"verdi":"5442","beskrivelse":"NESSEBY","oId":80006},{"id":4710,"verdi":"3818","beskrivelse":"TINN","oId":80006},{"id":4711,"verdi":"5443","beskrivelse":"BÅTSFJORD","oId":80006},{"id":4712,"verdi":"4215","beskrivelse":"LILLESAND","oId":80006},{"id":4713,"verdi":"5444","beskrivelse":"SØR-VARANGER","oId":80006},{"id":4714,"verdi":"4216","beskrivelse":"BIRKENES","oId":80006},{"id":4715,"verdi":"3819","beskrivelse":"HJARTDAL","oId":80006},{"id":4716,"verdi":"4217","beskrivelse":"ÅMLI","oId":80006},{"id":4717,"verdi":"3820","beskrivelse":"SELJORD","oId":80006},{"id":4718,"verdi":"4218","beskrivelse":"IVELAND","oId":80006},{"id":4719,"verdi":"3821","beskrivelse":"KVITESEID","oId":80006},{"id":4720,"verdi":"3822","beskrivelse":"NISSEDAL","oId":80006},{"id":4721,"verdi":"4219","beskrivelse":"EVJE OG HORNNES","oId":80006},{"id":4722,"verdi":"3823","beskrivelse":"FYRESDAL","oId":80006},{"id":4723,"verdi":"4220","beskrivelse":"BYGLAND","oId":80006},{"id":4724,"verdi":"3824","beskrivelse":"TOKKE","oId":80006},{"id":4725,"verdi":"4221","beskrivelse":"VALLE","oId":80006},{"id":4726,"verdi":"4222","beskrivelse":"BYKLE","oId":80006},{"id":4727,"verdi":"3825","beskrivelse":"VINJE","oId":80006},{"id":4728,"verdi":"4223","beskrivelse":"VENNESLA","oId":80006},{"id":4729,"verdi":"4224","beskrivelse":"ÅSERAL","oId":80006},{"id":4730,"verdi":"4226","beskrivelse":"HÆGEBOSTAD","oId":80006},{"id":4731,"verdi":"4227","beskrivelse":"KVINESDAL","oId":80006},{"id":4732,"verdi":"4228","beskrivelse":"SIRDAL","oId":80006}];

        var verdensdeler = [{"id":3735,"verdi":"1AF","beskrivelse":"Afrika","oId":80022},{"id":3736,"verdi":"1AQ","beskrivelse":"Antarktis","oId":80022},{"id":3737,"verdi":"1AS","beskrivelse":"Asia","oId":80022},{"id":3738,"verdi":"1EU","beskrivelse":"Europa","oId":80022},{"id":3739,"verdi":"1NA","beskrivelse":"Nord-Amerika","oId":80022},{"id":3740,"verdi":"1OS","beskrivelse":"Oseania","oId":80022},{"id":3741,"verdi":"1SA","beskrivelse":"Sør- og Mellom-Amerika","oId":80022}];

        var yrkeKategori = [{"id":3767,"verdi":"8","beskrivelse":"Annet","oId":80010},{"id":3768,"verdi":"6","beskrivelse":"Au pair","oId":80010},{"id":3769,"verdi":"4","beskrivelse":"Barnehagebarn","oId":80010},{"id":3770,"verdi":"10","beskrivelse":"Barnehagepersonell","oId":80010},{"id":3771,"verdi":"1","beskrivelse":"Helsepersonell","oId":80010},{"id":3772,"verdi":"11","beskrivelse":"Jobber med husdyr","oId":80010},{"id":3773,"verdi":"2","beskrivelse":"Matpersonell","oId":80010},{"id":3774,"verdi":"5","beskrivelse":"Student/Elev","oId":80010},{"id":3775,"verdi":"9","beskrivelse":"Ukjent","oId":80010},{"id":3776,"verdi":"3","beskrivelse":"Undervisningspersonell","oId":80010}];

        var arbeidsplassKategori = [{"id":3777,"verdi":"6","beskrivelse":"Annet","oId":80025},{"id":3778,"verdi":"2","beskrivelse":"Barnehage","oId":80025},{"id":3779,"verdi":"1","beskrivelse":"Grunnskole/Videregående","oId":80025},{"id":3780,"verdi":"5","beskrivelse":"Høyskole/Universitet","oId":80025},{"id":3781,"verdi":"4","beskrivelse":"Sykehjem","oId":80025},{"id":3782,"verdi":"3","beskrivelse":"Sykehus","oId":80025}];

        var arsakerTilUtenlandsopphold = [{"id":3884,"verdi":"8","beskrivelse":"Annet","oId":80019},{"id":3885,"verdi":"4","beskrivelse":"Arbeids-/studie-/langtidsopphold","oId":80019},{"id":3886,"verdi":"3","beskrivelse":"Forretningsreise","oId":80019},{"id":3887,"verdi":"5","beskrivelse":"Hjembesøk","oId":80019},{"id":3888,"verdi":"1","beskrivelse":"Smittet før innvandring","oId":80019},{"id":3889,"verdi":"2","beskrivelse":"Turisme","oId":80019},{"id":3890,"verdi":"9","beskrivelse":"Ukjent","oId":80019}];

        var jaNeiUkjent = [{"id":11,"verdi":"1","beskrivelse":"Ja","oId":80017},{"id":12,"verdi":"2","beskrivelse":"Nei","oId":80017},{"id":13,"verdi":"3","beskrivelse":"Ukjent","oId":80017}];

        var eksponeringssteder = [{"id":4754,"verdi":"01","beskrivelse":"Privat husstand","oId":80100},{"id":4755,"verdi":"02","beskrivelse":"Helseinstitusjon","oId":80100},{"id":4757,"verdi":"04","beskrivelse":"Barnehage/skole","oId":80100},{"id":4758,"verdi":"05","beskrivelse":"Serveringssted/bar/utested","oId":80100},{"id":4759,"verdi":"06","beskrivelse":"Arrangement","oId":80100},{"id":4760,"verdi":"07","beskrivelse":"Organisert fritidsaktivitet","oId":80100},{"id":4762,"verdi":"00","beskrivelse":"Annet","oId":80100},{"id":4763,"verdi":"99","beskrivelse":"Ukjent","oId":80100}];

        var sykehusListe = [{"id":1,"navn":"Akershus Universitetssykehus"},{"id":3,"navn":"Aker"},{"id":4,"navn":"Andre"},{"id":6,"navn":"Arendal"},{"id":7,"navn":"Askim SH"},{"id":8,"navn":"Blakstad psyk SH"},{"id":10,"navn":"Bodø"},{"id":12,"navn":"Bærum sykehus"},{"id":13,"navn":"Drammen sykehus"},{"id":14,"navn":"Diakonhjemmet sykehus"},{"id":16,"navn":"Elverum"},{"id":17,"navn":"Flekkefjord"},{"id":18,"navn":"Florø SH"},{"id":19,"navn":"Fredrikstad SH"},{"id":21,"navn":"Førde sentralsjukehus"},{"id":22,"navn":"Gjøvik"},{"id":23,"navn":"Hamar"},{"id":24,"navn":"Gaustad psyk SH"},{"id":25,"navn":"Glitreklinikken"},{"id":26,"navn":"Halden SH"},{"id":27,"navn":"Hallingdal Sjukestugu, Vestre Viken"},{"id":29,"navn":"Hammerfest sykehus"},{"id":30,"navn":"Haraldsplass diakonale sykehus"},{"id":32,"navn":"Harstad sykehus"},{"id":34,"navn":"Haugesund sykehus"},{"id":36,"navn":"Haukeland universitetssykehus"},{"id":37,"navn":"Kirkenes sykehus"},{"id":38,"navn":"Kongsberg sykehus"},{"id":39,"navn":"Kongsvinger"},{"id":40,"navn":"Horten SH"},{"id":42,"navn":"Kragerø"},{"id":43,"navn":"Kristiansand"},{"id":45,"navn":"Kristiansund"},{"id":47,"navn":"Larvik"},{"id":49,"navn":"Sykehuset Levanger"},{"id":50,"navn":"Lillehammer"},{"id":51,"navn":"Lofoten"},{"id":52,"navn":"Lærdal sykehus"},{"id":53,"navn":"Molde"},{"id":54,"navn":"Longyearbyen SH"},{"id":55,"navn":"Lovisenberg Diakonale sykehus"},{"id":56,"navn":"Mandal SH"},{"id":58,"navn":"Mosjøen"},{"id":59,"navn":"Sykehuset Namsos"},{"id":60,"navn":"Narvik"},{"id":61,"navn":"Nordfjord sykehus"},{"id":62,"navn":"Notodden"},{"id":63,"navn":"Odda sjukehus"},{"id":64,"navn":"Sykehuset Østfold, Moss"},{"id":65,"navn":"Olso Helseråd"},{"id":67,"navn":"Orkdal sykehus"},{"id":68,"navn":"Radiumhospitalet"},{"id":69,"navn":"Mo i Rana"},{"id":70,"navn":"Rikshospitalet"},{"id":71,"navn":"Ringerike sykehus"},{"id":72,"navn":"Rjukan"},{"id":73,"navn":"Sandefjord"},{"id":74,"navn":"Sandnessjøen"},{"id":75,"navn":"Skien"},{"id":76,"navn":"St Olavs hospital"},{"id":77,"navn":"Reinsvoll SH"},{"id":78,"navn":"Røros SH"},{"id":79,"navn":"Sanderud psyk SH"},{"id":80,"navn":"Sarpsborg SH"},{"id":81,"navn":"Ski SH"},{"id":83,"navn":"Stavanger Universitetssykehus"},{"id":84,"navn":"Stord sykehus"},{"id":85,"navn":"Tromsø"},{"id":86,"navn":"Tynset"},{"id":87,"navn":"Tønsberg"},{"id":88,"navn":"Ullevål"},{"id":89,"navn":"Vesterålen"},{"id":90,"navn":"Volda"},{"id":91,"navn":"Voss sykehus"},{"id":92,"navn":"Ålesund"},{"id":93,"navn":"Stensby SH"},{"id":94,"navn":"Sunnaas SH"},{"id":95,"navn":"Trønd psyk SH"},{"id":96,"navn":"Sykehuset Østfold, Kalnes"},{"id":97,"navn":"Åsgard psyk SH"}];

        var underliggendeSykdommer = [{"id":4736,"verdi":"01","beskrivelse":"Kreft","oId":80099},{"id":4737,"verdi":"02","beskrivelse":"Kols","oId":80099},{"id":4738,"verdi":"03","beskrivelse":"Nedsatt immunforsvar","oId":80099},{"id":4739,"verdi":"04","beskrivelse":"Diabetes","oId":80099},{"id":4740,"verdi":"05","beskrivelse":"Hjertesykdom","oId":80099},{"id":4741,"verdi":"06","beskrivelse":"Fedme (KMI>30)","oId":80099},{"id":4742,"verdi":"07","beskrivelse":"Astma","oId":80099},{"id":4743,"verdi":"08","beskrivelse":"Kronisk lungesykdom","oId":80099},{"id":4744,"verdi":"09","beskrivelse":"Nyresykdom","oId":80099},{"id":4745,"verdi":"10","beskrivelse":"Leversykdom","oId":80099},{"id":4746,"verdi":"11","beskrivelse":"Nevrologisk/nevromuskulær","oId":80099},{"id":4747,"verdi":"12","beskrivelse":"Graviditet","oId":80099},{"id":4748,"verdi":"13","beskrivelse":"Røyker","oId":80099},{"id":4749,"verdi":"14","beskrivelse":"Opphold med risikofaktorer","oId":80099},{"id":4750,"verdi":"15","beskrivelse":"Forhøyet blodtrykk (hypertensjon)","oId":80099},{"id":4751,"verdi":"97","beskrivelse":"Annet","oId":80099},{"id":4752,"verdi":"98","beskrivelse":"Ingen underliggende sykdom","oId":80099},{"id":4753,"verdi":"99","beskrivelse":"Ukjent","oId":80099}];

        var codeLookup = function(codes,field,value) {
            var codeFound = null;
            codes.forEach(function (code){
                if(code[field] == value) {
                    codeFound = code;
                }
            });
            return codeFound;
        }

        var getKjonn = function(kjonn) {
            var codes = [{"id": 1,"verdi": "1","beskrivelse": "Mann","oId": 3101}, {"id": 2,"verdi": "2","beskrivelse": "Kvinne","oId": 3101}, {"id": 3,"verdi": "9","beskrivelse": "Ikke kjent","oId": 3101}];
            return codeLookup(codes,"beskrivelse",kjonn);
        }

        var getBosted = function(kommuneNr) {
            return codeLookup(kommunerOgBydeler,"verdi",kommuneNr);
        }

        var getFodeland = function(fodeland) {
            return codeLookup(land,"beskrivelse",fodeland);
        }

        var getYrke = function(yrke) {
            var map = {};
            map['Ikke yrkesaktiv']='Annet';
            map['Butikkansatt']='Annet';
            map['Frisør og lignende']='Annet';
            map['Laboratoriearbeider']='Annet';
            map['Student']='Student/Elev';
            map['Drosjesjåfør']='Annet';
            map['Bussjåfør']='Annet';
            map['Pensjonist']='Annet';
            map['Helsepersonell (inkl tannhelse og apotekansatte)']='Helsepersonell';
            map['Lærer']='Undervisningspersonell';
            map['Barnehageansatt']='Barnehagepersonell';
            map['Barnehagebarn']='Barnehagebarn';
            map['Elev']='Student/Elev';
            map['Annet Yrke']='Annet';
            map['Au pair']='Au pair';
            map['Ukjent']='Ukjent';
            map['Jobber med husdyr']='Jobber med husdyr';
            map['Matpersonell']='Matpersonell';

            return codeLookup(yrkeKategori,"beskrivelse",map[yrke]);
        }

        var getSmittested = function(bakgrunn, kommuneNr) {
            if(bakgrunn.QPBQ6ha3KSU == 'Ukjent') {
                return {"id":3745,"verdi":"1UK","beskrivelse":"Ukjent","oId":80022};
            } else if (bakgrunn.QPBQ6ha3KSU == 'Verdensdel') {
                return codeLookup(verdensdeler, 'beskrivelse', bakgrunn.r9wly8yChCe );
            } else if (bakgrunn.QPBQ6ha3KSU == 'Land') {
                return codeLookup(land, 'beskrivelse', bakgrunn.G2EbXQPYKUM );
            } else if (bakgrunn.QPBQ6ha3KSU == 'Kommune') {
                return codeLookup(kommunerOgBydeler, 'beskrivelse', bakgrunn.hYwdup3TdCH );
            } else if (bakgrunn.QPBQ6ha3KSU == 'Bydel') {
                return codeLookup(kommunerOgBydeler, 'beskrivelse', bakgrunn.hYwdupxX6HSBa83pB3TdCH );
            } else if (bakgrunn.QPBQ6ha3KSU == 'Registrerende kommune') {
                return codeLookup(kommunerOgBydeler, 'verdi', kommuneNr );
            }
        }

        var getArsakTilUtenlandsopphold = function(aarsak) {
            return codeLookup(arsakerTilUtenlandsopphold,"beskrivelse",aarsak);
        }

        var getJaNeiUkjent = function(value) {
            return codeLookup(jaNeiUkjent, "beskrivelse", value);
        }

        var getEksponeringssted = function(value) {
            var map = {};
            map['Privat husstand'] = 'Husstand';
            map['Samling i privat hjem'] = 'Samling i privat hjem';
            map['Privat arrangement på offentlig sted'] = 'Privat arrangement på offentlig sted';
            map['Arrangement'] = 'Arrangement offentlig';
            map['Barnehage og Skole'] = 'Barnehage/skole - barn/elev';
            map['Jobb'] = 'Jobb - i arbeidstid';
            map['Helseinstitusjon og sykehjem'] = 'Helseinstitusjon - pasient';
            map['Organisert fritidsaktivitet'] = 'Organisert fritidsaktivitet';
            map['Reise'] = 'Reise';
            map['Servering/bar/utested'] = 'Serveringssted/bar/utested - gjest';
            map['Universitet'] = 'Universitet/høyskole';
            map['Annet'] = 'Annet';
            map['Ukjent'] = 'Ukjent';
            map['Offentlig transport'] = 'Annet';

            return codeLookup(eksponeringssteder,"beskrivelse",map[value])
        }

        var getInnlagtSykehus = function(sisteHelseStatus) {
            if(sisteHelseStatus.bOYWVEBaWy6 == 'Innlagt på sykehus - fortsatt i isolasjon') {
                return getJaNeiUkjent("Ja");
            } else if(sisteHelseStatus == "Ukjent") {
                return getJaNeiUkjent("Ukjent");
            } else if(sisteHelseStatus != "Ukjent") {
                return getJaNeiUkjent("Nei");
            }
        }

        var getInnlagtSykehjem = function(sisteHelseStatus) {
            if(sisteHelseStatus.bOYWVEBaWy6 == 'Innlagt på sykehjem - fortsatt i isolasjon') {
                return getJaNeiUkjent("Ja");
            } else if(sisteHelseStatus == "Ukjent") {
                return getJaNeiUkjent("Ukjent");
            } else if(sisteHelseStatus != "Ukjent") {
                return getJaNeiUkjent("Nei");
            }
        }

        var getSykehus = function(sykehus) {
            return codeLookup(sykehusListe,"navn",sykehus);
        }

        var getIndikasjon = function(indikasjon){
            return null;
            //TODO Mangler kodeliste
        }

        var getSykdomsBilde = function(helseutfall) {
            if(helseutfall.bOYWVEBaWy6 == 'Asymptomatisk - fortsatt i isolasjon') {
                return {"id":3819,"verdi":"00","beskrivelse":"Asymptomatisk","oId":80015};
            } else if(helseutfall.bOYWVEBaWy6 == 'Innlagt på sykehus - fortsatt i isolasjon' ||
                        helseutfall.bOYWVEBaWy6 == 'Innlagt på sykehjem - fortsatt i isolasjon' ||
                        helseutfall.bOYWVEBaWy6 == 'Har Covid-19 symptomer - fortsatt i isolasjon') {
                return {"id":3851,"verdi":"21","beskrivelse":"Øvre LVI","oId":80015};
            } else if (helseutfall.bOYWVEBaWy6 == 'Annet'){
                return {"id":3817,"verdi":"90","beskrivelse":"Annet","oId":80015};
            } else if (helseutfall.bOYWVEBaWy6 == 'Ukjent'){
                return {"id":3848,"verdi":"99","beskrivelse":"Ukjent","oId":80015};
            } else {
                return null;
            }
        }

        var getUnderliggendeSykdomListe = function(bakgrunn) {
            var sykdommer = [];

            if(bakgrunn.VwIcGOFyi3Q){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Astma'))};
            if(bakgrunn.coUb4QcuVKI){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Diabetes'))};
            if(bakgrunn.geeY6wHrzA0){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Fedme'))};
            if(bakgrunn.AaBuania9Ot){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Forhøyet blodtrykk'))};
            if(bakgrunn.K7uUiBkrkYB){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Hjertesykdom'))};
            if(bakgrunn.VIa8JayRQbA){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Kols'))};
            if(bakgrunn.rMRNPKj8FBS){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Kreft'))};
            if(bakgrunn.j6LrBVzW3k4){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Leversykdom'))};
            if(bakgrunn.vWzPVyomNL8){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Nedsatt immunforsvar'))};
            if(bakgrunn.j6LrBVzW3k4){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Nevrologisk/nevromuskulær sykdom'))};
            if(bakgrunn.rMRNPKj8FBS){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Nyresykdom'))};
            if(bakgrunn.rtxSNjWcnxC){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Røyker?'))};
            if(bakgrunn.NrUvDud9C5g){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Kronisk lungesykdom'))};
            if(bakgrunn.Bt9xOiBUuDW){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Graviditet'))};
            if(bakgrunn.Blwor7jyBB9){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Annet'))};
            if(bakgrunn.RUHPJ5GVvjb){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','ukjent'))};
            
            return sykdommer;
        }

        var constructNotificationMessage = function(tei,events,kommuneNr) {

            var bakgrunnsUndersokelse = {};
            var sisteHelseStatus = {};
            var sistePositiveTest = {};
            events.forEach(function(event) {
                if (event.programStage == 'LpWNjNGvCO5') {
                    bakgrunnsUndersokelse = event;
                } else if (event.programStage == 'oqsk2Jv4k3s') {
                    sisteHelseStatus = event;
                } else if (event.programStage == 'dDHkBd3X8Ce' && event.ovY6E8BSdto == 'Positiv') {
                    sistePositiveTest = event;
                }
            });

            //------PASIENT

            var pasient = {
                fodselsnummer: tei.ZSt07qyq6Pt,
                fodselsdato: tei.NI0QRzJvQ0k,
                fornavn: tei.sB1IHYu2xQT,
                etternavn: tei.ENRjVGxVL6l,
                bosted: getBosted(kommuneNr),
                arbeidsplass: tei.ooK7aSiAaGq,
                //arbeidsplasskategori: {
                //  id: 0,
                //  verdi: string,
                //  beskrivelse: string,
                //  oid: 0
                //}
              };

            var kjonn = getKjonn(tei.oindugucx72);
            if(kjonn) {
                pasient.kjonn = kjonn;
            }

            var fodeland = getFodeland(tei.hBcoBCZBWFb);
            if(fodeland) {
                pasient.fodeland = fodeland;
            }

            var yrkesgruppe = getYrke(tei.l5y5P4d1vbM);
            if(yrkesgruppe) {
                pasient.yrkesgruppe = yrkesgruppe;
            }

            //------SMITTEFORHOLD

            var smitteforhold = {
                annetSmittested: bakgrunnsUndersokelse.VyaD2KGfpUA,
                datoForHjemkomst: bakgrunnsUndersokelse.brUNizYRJ6i,
              };

            var smittested = getSmittested(bakgrunnsUndersokelse, kommuneNr);
            if(smittested) {
                smitteforhold.smittested = smittested;
            }

            var arsakTilUtenlandsopphold = getArsakTilUtenlandsopphold(bakgrunnsUndersokelse.LwjOWAWb4Jm);
            if(arsakTilUtenlandsopphold) {
                smitteforhold.arsakTilUtenlandsopphold = arsakTilUtenlandsopphold
            }

            var harBekreftetNarkontakt = getJaNeiUkjent(bakgrunnsUndersokelse.WkjX7MGyi8z);
            if(harBekreftetNarkontakt) {
                smitteforhold.harBekreftetNarkontakt = harBekreftetNarkontakt;
            }

            var eksponeringssted = getEksponeringssted(bakgrunnsUndersokelse.XA2Pk3U89ty);
            if(eksponeringssted) {
                smitteforhold.eksponeringssted = eksponeringssted;
            }

            //-------DIAGNOSEFORHOLD
            var diagnoseforhold = {
                //hardkodes ved Covid19
                diagnose: {"id":4734,"verdi":"713","beskrivelse":"Koronavirus med utbruddspotensial","oId":80012},
                smittestoff: {"id":4735,"verdi":"71300","beskrivelse":"SARS-COV-2","oId":80000},
                sykehjemNavn: sisteHelseStatus.SFaxZRvgnsg,
                innsykningsdato: sisteHelseStatus.s3eoonJ8OJb,
                provedato: sistePositiveTest.ylnZBwlN80w,
                //annenIndikasjon: string,  <-- DENNE FINNES IKKE I FIKS
                //annenKlinikk: string,    <-- DENNE ER IKKE DISKUTERT, FINNES IKKE I FIKS OG SER DEN IKKE I MSIS WEB
                //utfallAvSykdommen: {      <-- DENNE ER IKKE DISKUTERT, FINNES IKKE I FIKS OG SER DEN IKKE I MSIS WEB
                //  id: 0,
                //  verdi: string,
                //  beskrivelse: string,
                //  oid: 0
                //},
                //folgetilstander: string,     <-- DENNE ER IKKE DISKUTERT, FINNES IKKE I FIKS OG SER DEN IKKE I MSIS WEB
                dodsdato: sisteHelseStatus.dDEdmn8q3P1
              };

            var erInnlagtPaaSykehjem = getInnlagtSykehjem(sisteHelseStatus);
            if(erInnlagtPaaSykehjem) {
                diagnoseforhold.erInnlagtPaaSykehjem = erInnlagtPaaSykehjem;
            }

            var erInnlagtPaaSykehus = getInnlagtSykehus(sisteHelseStatus);
            if(erInnlagtPaaSykehjem) {
                diagnoseforhold.erInnlagtPaaSykehus = erInnlagtPaaSykehus;
            }

            var sykehus = getSykehus(sisteHelseStatus.yBUxbX079to);
            if(sykehus) {
                diagnoseforhold.sykehus = sykehus;
            }

            var indikasjon = getIndikasjon(bakgrunnsUndersokelse.vrrQP9OrjOB);
            if(indikasjon) {
                diagnoseforhold.indikasjon = indikasjon;
            }

            var sykdomsbilde = getSykdomsBilde(sisteHelseStatus);
            if(sykdomsbilde) {
                diagnoseforhold.sykdomsbilde = sykdomsbilde;
            }

            var underliggendeSykdom = getUnderliggendeSykdomListe(bakgrunnsUndersokelse);
            diagnoseforhold.underliggendeSykdom = underliggendeSykdom;

            //-------MELDING

            var melding = {
                pasient: pasient,
                diagnoseforhold: diagnoseforhold,
                antattSmittemate: {
                //smittemåte hardkodes for Covid
                smittemate: {"id":3873,"verdi":"70","beskrivelse":"Luft/Dråpesmitte","oId":80018},
                //smittesituasjon: string    <- MAPPING IKKE DISKUTERT
                rekvirent: {}
                },
                smitteforhold: smitteforhold,
            }
            return melding;
        };

        return {
            lookupFnr: function(fNr,kommuneNr,userId) {
                var url = '../' + DHIS2URL + '/person/sok';
                var promise = $http({
                    method: 'POST',
                    url: url,
                    data: {fnr:fNr, kommunenr:kommuneNr, userid:userId},
                    headers: {'Content-Type': 'application/json'}
                }).then(function(response){
                    var errorMsgHdr, errorMsgBody;
                    errorMsgHdr = $translate.instant('error');

                    if(response.data.statusFolkeregister == 'NOT_SUPPORTED' && !not_supported_message_shown_previously) {
                        errorMsgHdr = "Folkeregisteroppslag må aktiveres for din kommune"
                        errorMsgBody = `<p>For å hente data fra folkeregisteret må kommunen inngå avtale med KS om bruk av Fiks folkeregister. Dette må dere gjøre:<br>
                                <ol>
                                    <li>Dere må fylle ut skjemaet RF – 1514 «Søknad om tilgang til Folkeregisteret» i Altinn.</li>
                                    <li>Dere må deretter tildele KS rettighet til å bruke folkeregisteropplysninger på deres vegne.</li>
                                    <li>Dere må inngå avtale med KS om bruk av Fiks folkeregister.<br>
                                    Avtalen og veiledning til skjemaene i Altinn finner dere her: <a target="_blank" href="https://svarut.wordpress.com/fiks/avtalen/">https://svarut.wordpress.com/fiks/avtalen/</a></li>
                                </ol>
                            </p>
                            
                            <p>Når dere har signert og sendt inn avtalen, kan dere sette opp tjenesten på <a target="_blank" href="https://forvaltning.fiks.ks.no/">forvaltningsiden til Fiks-plattformen</a>. Dere må deretter aktivere bruk av folkeregisteret i konfigurasjonen for Fiks smittesporing.</p>
                            
                            <p>Ta gjerne kontakt med KS på <a target="_blank" href="mailto:smittesporing@ks.no">smittesporing@ks.no</a> hvis du har spørsmål.</p>
                            
                            <p>Når folkeregisteret ikke er aktivert, vil kun e-post og telefonnummer hentes fra kontakt- og reservasjonsregisteret.</p>`;
                        not_supported_message_shown_previously = true;
                    }

                    if(response.data.statusFolkeregister == 'NONE') {
                        errorMsgBody = 'Fant ingen data på det angitte personnummeret i folkeregisteret: ' + fNr + ' Data om personen må legges inn manuelt i skjemaet under.';
                    }

                    if(response.data.statusFolkeregister == 'FAILED') {
                        errorMsgBody = 'Noe gikk galt i tjenesten for uthenting av data om person fra folkeregisteret. '
                            + 'Prøv igjen senere eller fyll inn persondata manuelt.';
                    }
                    
                    if(errorMsgBody) {
                        NotificationService.showNotifcationDialog(errorMsgHdr, errorMsgBody);
                    }                    

                    return response.data;
                },function(error){
                    var errorMsgHdr, errorMsgBody;
                    errorMsgHdr = $translate.instant('error');

                    errorMsgBody =  'Feil ved henting av data om person:' + fNr;

                    if(error.status == 404) {
                        errorMsgBody = 'Tjeneste for henting av data om person er ikke tilgjengelig. '
                            + 'Prøv igjen senere eller fyll inn persondata manuelt.';
                    }

                    if(error.status == 403) {
                        errorMsgBody = 'Feil ved henting av data, prøv å logge inn på nytt.';
                    }

                    NotificationService.showNotifcationDialog(errorMsgHdr, errorMsgBody);
                    return null;
                });
                return promise;
            },
            lookupLabSvar: function(fNr, kommuneNr, userId) {
                var url = '../' + DHIS2URL + '/provesvar/sok';
                var promise = $http({
                    method: 'POST',
                    url: url,
                    data: {fnr:fNr, kommunenr:kommuneNr, userid:userId},
                    headers: {'Content-Type': 'application/json'}
                }).then(function(response){                  
                    return response.data;
                },function(error){
                    var errorMsgHdr, errorMsgBody;
                    errorMsgHdr = $translate.instant('error');

                    errorMsgBody =  'Feil ved henting av prøvesvar:' + fNr;

                    if(error.status == 403) {
                        errorMsgBody = `Tjenesten Fiks prøvesvar er ikke tilgjengelig for deg.
                        Det kan være to årsaker til dette
                        <ol>
                        <li>Din kommune har ikke aktivert tjenesten Fiks prøvesvar. Les mer om aktivering av Fiks prøvesvar her: <a target="_blank" href="https://portal.fiks.ks.no/fiks/fiks-provesvar/">https://portal.fiks.ks.no/fiks/fiks-provesvar/</a></li>
                        <li>Tjenesten er aktivert, men du har ikke fått rettigheter til å gjøre oppslag. Ta kontakt med Fiks administrator i din kommune.</li>
                        </ol>`;
                    }
                    else if(error.status == 401) {
                        errorMsgBody = "Kunne ikke nå tjeneste for prøvesvar, prøv å logge inn på nytt.";
                    }

                    NotificationService.showNotifcationDialog(errorMsgHdr, errorMsgBody);
                    return null;
                });
                return promise;
            },
            sendNotificationMessage: function(kommuneNr, userId, tei,allEvents) {
                var url = '../' + DHIS2URL + '/klinikermelding';
                var melding = constructNotificationMessage(tei,allEvents,kommuneNr);
                var promise = $http({
                    method: 'POST',
                    url: url,
                    data: {melding:melding, kommunenr:kommuneNr, userid:userId},
                    headers: {'Content-Type': 'application/json'}
                }).then(function(response){                  
                    return response.data;
                },function(error){
                    var errorMsgHdr, errorMsgBody;
                    errorMsgHdr = $translate.instant('error');

                    errorMsgBody =  'Feil ved innsending av klinikermelding til MSIS';

                    if(error.status == 403) {
                        errorMsgBody = `...`;
                    }
                    else if(error.status == 401) {
                        errorMsgBody = "...";
                    }

                    NotificationService.showNotifcationDialog(errorMsgHdr, errorMsgBody);
                    return null;
                });
                return promise;
            }
        }
    }
)
