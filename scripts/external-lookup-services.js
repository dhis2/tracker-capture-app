/* global angular, moment, dhis2 */

'use strict';

/* Services */

var externalLookupServices = angular.module('externalLookupServices', ['ngResource', 'ngCookies'])

.service('FNrLookupService', function($http, DHIS2URL, $translate, $cookies, NotificationService, DateUtils) {
        var not_supported_message_shown_previously = false;

        var land = [
            {
              "id": 3526,
              "verdi": "204",
              "beskrivelse": "Angola",
              "oid": 80007
            },
            {
              "id": 3527,
              "verdi": "393",
              "beskrivelse": "Burkina Faso",
              "oid": 80007
            },
            {
              "id": 3528,
              "verdi": "216",
              "beskrivelse": "Burundi",
              "oid": 80007
            },
            {
              "id": 3529,
              "verdi": "229",
              "beskrivelse": "Benin",
              "oid": 80007
            },
            {
              "id": 3530,
              "verdi": "205",
              "beskrivelse": "Botswana",
              "oid": 80007
            },
            {
              "id": 3531,
              "verdi": "279",
              "beskrivelse": "Kongo (Dem.Rep.)",
              "oid": 80007
            },
            {
              "id": 3532,
              "verdi": "355",
              "beskrivelse": "Sør-Sudan",
              "oid": 80007
            },
            {
              "id": 3533,
              "verdi": "379",
              "beskrivelse": "Tunisia",
              "oid": 80007
            },
            {
              "id": 3534,
              "verdi": "369",
              "beskrivelse": "Tanzania",
              "oid": 80007
            },
            {
              "id": 3535,
              "verdi": "386",
              "beskrivelse": "Uganda",
              "oid": 80007
            },
            {
              "id": 3536,
              "verdi": "359",
              "beskrivelse": "Sør-Afrika",
              "oid": 80007
            },
            {
              "id": 3537,
              "verdi": "389",
              "beskrivelse": "Zambia",
              "oid": 80007
            },
            {
              "id": 3538,
              "verdi": "326",
              "beskrivelse": "Zimbabwe",
              "oid": 80007
            },
            {
              "id": 3539,
              "verdi": "336",
              "beskrivelse": "Senegal",
              "oid": 80007
            },
            {
              "id": 3540,
              "verdi": "346",
              "beskrivelse": "Somalia",
              "oid": 80007
            },
            {
              "id": 3541,
              "verdi": "333",
              "beskrivelse": "Sao Tome og Principe",
              "oid": 80007
            },
            {
              "id": 3542,
              "verdi": "357",
              "beskrivelse": "Swaziland",
              "oid": 80007
            },
            {
              "id": 3543,
              "verdi": "373",
              "beskrivelse": "Tchad",
              "oid": 80007
            },
            {
              "id": 3544,
              "verdi": "376",
              "beskrivelse": "Togo",
              "oid": 80007
            },
            {
              "id": 3545,
              "verdi": "309",
              "beskrivelse": "Niger",
              "oid": 80007
            },
            {
              "id": 3546,
              "verdi": "313",
              "beskrivelse": "Nigeria",
              "oid": 80007
            },
            {
              "id": 3547,
              "verdi": "329",
              "beskrivelse": "Rwanda",
              "oid": 80007
            },
            {
              "id": 3548,
              "verdi": "338",
              "beskrivelse": "Seychellene",
              "oid": 80007
            },
            {
              "id": 3549,
              "verdi": "356",
              "beskrivelse": "Sudan",
              "oid": 80007
            },
            {
              "id": 3550,
              "verdi": "339",
              "beskrivelse": "Sierra Leone",
              "oid": 80007
            },
            {
              "id": 3551,
              "verdi": "299",
              "beskrivelse": "Mali",
              "oid": 80007
            },
            {
              "id": 3552,
              "verdi": "306",
              "beskrivelse": "Mauretania",
              "oid": 80007
            },
            {
              "id": 3553,
              "verdi": "307",
              "beskrivelse": "Mauritius",
              "oid": 80007
            },
            {
              "id": 3554,
              "verdi": "296",
              "beskrivelse": "Malawi",
              "oid": 80007
            },
            {
              "id": 3555,
              "verdi": "319",
              "beskrivelse": "Mosambik",
              "oid": 80007
            },
            {
              "id": 3556,
              "verdi": "308",
              "beskrivelse": "Namibia",
              "oid": 80007
            },
            {
              "id": 3557,
              "verdi": "220",
              "beskrivelse": "Comorene",
              "oid": 80007
            },
            {
              "id": 3558,
              "verdi": "283",
              "beskrivelse": "Liberia",
              "oid": 80007
            },
            {
              "id": 3559,
              "verdi": "281",
              "beskrivelse": "Lesotho",
              "oid": 80007
            },
            {
              "id": 3560,
              "verdi": "286",
              "beskrivelse": "Libya",
              "oid": 80007
            },
            {
              "id": 3561,
              "verdi": "303",
              "beskrivelse": "Marokko",
              "oid": 80007
            },
            {
              "id": 3562,
              "verdi": "289",
              "beskrivelse": "Madagaskar",
              "oid": 80007
            },
            {
              "id": 3563,
              "verdi": "260",
              "beskrivelse": "Ghana",
              "oid": 80007
            },
            {
              "id": 3564,
              "verdi": "256",
              "beskrivelse": "Gambia",
              "oid": 80007
            },
            {
              "id": 3565,
              "verdi": "264",
              "beskrivelse": "Guinea",
              "oid": 80007
            },
            {
              "id": 3566,
              "verdi": "235",
              "beskrivelse": "Ekvatorial Guinea",
              "oid": 80007
            },
            {
              "id": 3567,
              "verdi": "266",
              "beskrivelse": "Guinea-Bissau",
              "oid": 80007
            },
            {
              "id": 3568,
              "verdi": "276",
              "beskrivelse": "Kenya",
              "oid": 80007
            },
            {
              "id": 3569,
              "verdi": "203",
              "beskrivelse": "Algerie",
              "oid": 80007
            },
            {
              "id": 3570,
              "verdi": "249",
              "beskrivelse": "Egypt",
              "oid": 80007
            },
            {
              "id": 3571,
              "verdi": "304",
              "beskrivelse": "Vest Sahara",
              "oid": 80007
            },
            {
              "id": 3572,
              "verdi": "241",
              "beskrivelse": "Eritrea",
              "oid": 80007
            },
            {
              "id": 3573,
              "verdi": "246",
              "beskrivelse": "Etiopia",
              "oid": 80007
            },
            {
              "id": 3574,
              "verdi": "254",
              "beskrivelse": "Gabon",
              "oid": 80007
            },
            {
              "id": 3575,
              "verdi": "337",
              "beskrivelse": "Sentralafrikanske Republikk",
              "oid": 80007
            },
            {
              "id": 3576,
              "verdi": "278",
              "beskrivelse": "Kongo-Brazzaville",
              "oid": 80007
            },
            {
              "id": 3577,
              "verdi": "239",
              "beskrivelse": "Elfenbenskysten",
              "oid": 80007
            },
            {
              "id": 3578,
              "verdi": "270",
              "beskrivelse": "Kamerun",
              "oid": 80007
            },
            {
              "id": 3579,
              "verdi": "273",
              "beskrivelse": "Kapp Verde",
              "oid": 80007
            },
            {
              "id": 3580,
              "verdi": "250",
              "beskrivelse": "Djibouti",
              "oid": 80007
            },
            {
              "id": 3581,
              "verdi": "426",
              "beskrivelse": "Forente Arabiske Emirater",
              "oid": 80007
            },
            {
              "id": 3582,
              "verdi": "404",
              "beskrivelse": "Afghanistan",
              "oid": 80007
            },
            {
              "id": 3583,
              "verdi": "410",
              "beskrivelse": "Bangladesh",
              "oid": 80007
            },
            {
              "id": 3584,
              "verdi": "409",
              "beskrivelse": "Bahrain",
              "oid": 80007
            },
            {
              "id": 3585,
              "verdi": "416",
              "beskrivelse": "Brunei Darussalam",
              "oid": 80007
            },
            {
              "id": 3586,
              "verdi": "412",
              "beskrivelse": "Bhutan",
              "oid": 80007
            },
            {
              "id": 3587,
              "verdi": "554",
              "beskrivelse": "Usbekistan",
              "oid": 80007
            },
            {
              "id": 3588,
              "verdi": "575",
              "beskrivelse": "Vietnam",
              "oid": 80007
            },
            {
              "id": 3589,
              "verdi": "578",
              "beskrivelse": "Jemen",
              "oid": 80007
            },
            {
              "id": 3590,
              "verdi": "564",
              "beskrivelse": "Syria",
              "oid": 80007
            },
            {
              "id": 3591,
              "verdi": "568",
              "beskrivelse": "Thailand",
              "oid": 80007
            },
            {
              "id": 3592,
              "verdi": "550",
              "beskrivelse": "Tadsjikistan",
              "oid": 80007
            },
            {
              "id": 3593,
              "verdi": "552",
              "beskrivelse": "Turkmenistan",
              "oid": 80007
            },
            {
              "id": 3594,
              "verdi": "537",
              "beskrivelse": "Øst-Timor",
              "oid": 80007
            },
            {
              "id": 3595,
              "verdi": "432",
              "beskrivelse": "Taiwan",
              "oid": 80007
            },
            {
              "id": 3596,
              "verdi": "428",
              "beskrivelse": "Filippinene",
              "oid": 80007
            },
            {
              "id": 3597,
              "verdi": "534",
              "beskrivelse": "Pakistan",
              "oid": 80007
            },
            {
              "id": 3598,
              "verdi": "524",
              "beskrivelse": "Palestina",
              "oid": 80007
            },
            {
              "id": 3599,
              "verdi": "540",
              "beskrivelse": "Qatar",
              "oid": 80007
            },
            {
              "id": 3600,
              "verdi": "544",
              "beskrivelse": "Saudi-Arabia",
              "oid": 80007
            },
            {
              "id": 3601,
              "verdi": "548",
              "beskrivelse": "Singapore",
              "oid": 80007
            },
            {
              "id": 3602,
              "verdi": "516",
              "beskrivelse": "Mongolia",
              "oid": 80007
            },
            {
              "id": 3603,
              "verdi": "513",
              "beskrivelse": "Maldivene",
              "oid": 80007
            },
            {
              "id": 3604,
              "verdi": "512",
              "beskrivelse": "Malaysia",
              "oid": 80007
            },
            {
              "id": 3605,
              "verdi": "528",
              "beskrivelse": "Nepal",
              "oid": 80007
            },
            {
              "id": 3606,
              "verdi": "520",
              "beskrivelse": "Oman",
              "oid": 80007
            },
            {
              "id": 3607,
              "verdi": "827",
              "beskrivelse": "Papua Ny-Guinea",
              "oid": 80007
            },
            {
              "id": 3608,
              "verdi": "492",
              "beskrivelse": "Sør-Korea",
              "oid": 80007
            },
            {
              "id": 3609,
              "verdi": "496",
              "beskrivelse": "Kuwait",
              "oid": 80007
            },
            {
              "id": 3610,
              "verdi": "504",
              "beskrivelse": "Laos",
              "oid": 80007
            },
            {
              "id": 3611,
              "verdi": "508",
              "beskrivelse": "Libanon",
              "oid": 80007
            },
            {
              "id": 3612,
              "verdi": "424",
              "beskrivelse": "Sri Lanka",
              "oid": 80007
            },
            {
              "id": 3613,
              "verdi": "420",
              "beskrivelse": "Myanmar",
              "oid": 80007
            },
            {
              "id": 3614,
              "verdi": "456",
              "beskrivelse": "Iran",
              "oid": 80007
            },
            {
              "id": 3615,
              "verdi": "476",
              "beskrivelse": "Jordan",
              "oid": 80007
            },
            {
              "id": 3616,
              "verdi": "464",
              "beskrivelse": "Japan",
              "oid": 80007
            },
            {
              "id": 3617,
              "verdi": "502",
              "beskrivelse": "Kirgisistan",
              "oid": 80007
            },
            {
              "id": 3618,
              "verdi": "478",
              "beskrivelse": "Kambodsja",
              "oid": 80007
            },
            {
              "id": 3619,
              "verdi": "488",
              "beskrivelse": "Nord-Korea",
              "oid": 80007
            },
            {
              "id": 3620,
              "verdi": "484",
              "beskrivelse": "Kina",
              "oid": 80007
            },
            {
              "id": 3621,
              "verdi": "436",
              "beskrivelse": "Hongkong",
              "oid": 80007
            },
            {
              "id": 3622,
              "verdi": "448",
              "beskrivelse": "Indonesia",
              "oid": 80007
            },
            {
              "id": 3623,
              "verdi": "460",
              "beskrivelse": "Israel",
              "oid": 80007
            },
            {
              "id": 3624,
              "verdi": "444",
              "beskrivelse": "India",
              "oid": 80007
            },
            {
              "id": 3625,
              "verdi": "452",
              "beskrivelse": "Irak",
              "oid": 80007
            },
            {
              "id": 3626,
              "verdi": "111",
              "beskrivelse": "Albania",
              "oid": 80007
            },
            {
              "id": 3627,
              "verdi": "406",
              "beskrivelse": "Armenia",
              "oid": 80007
            },
            {
              "id": 3628,
              "verdi": "153",
              "beskrivelse": "Østerrike",
              "oid": 80007
            },
            {
              "id": 3629,
              "verdi": "407",
              "beskrivelse": "Aserbajdsjan",
              "oid": 80007
            },
            {
              "id": 3630,
              "verdi": "155",
              "beskrivelse": "Bosnia-Hercegovina",
              "oid": 80007
            },
            {
              "id": 3631,
              "verdi": "112",
              "beskrivelse": "Belgia",
              "oid": 80007
            },
            {
              "id": 3632,
              "verdi": "160",
              "beskrivelse": "Montenegro",
              "oid": 80007
            },
            {
              "id": 3635,
              "verdi": "161",
              "beskrivelse": "Kosovo",
              "oid": 80007
            },
            {
              "id": 3636,
              "verdi": "114",
              "beskrivelse": "Andorra",
              "oid": 80007
            },
            {
              "id": 3637,
              "verdi": "106",
              "beskrivelse": "Sverige",
              "oid": 80007
            },
            {
              "id": 3638,
              "verdi": "146",
              "beskrivelse": "Slovenia",
              "oid": 80007
            },
            {
              "id": 3639,
              "verdi": "157",
              "beskrivelse": "Slovakia",
              "oid": 80007
            },
            {
              "id": 3640,
              "verdi": "143",
              "beskrivelse": "Tyrkia",
              "oid": 80007
            },
            {
              "id": 3641,
              "verdi": "148",
              "beskrivelse": "Ukraina",
              "oid": 80007
            },
            {
              "id": 3642,
              "verdi": "159",
              "beskrivelse": "Serbia",
              "oid": 80007
            },
            {
              "id": 3643,
              "verdi": "127",
              "beskrivelse": "Nederland",
              "oid": 80007
            },
            {
              "id": 3644,
              "verdi": "100",
              "beskrivelse": "Norge",
              "oid": 80007
            },
            {
              "id": 3645,
              "verdi": "131",
              "beskrivelse": "Polen",
              "oid": 80007
            },
            {
              "id": 3646,
              "verdi": "132",
              "beskrivelse": "Portugal",
              "oid": 80007
            },
            {
              "id": 3647,
              "verdi": "133",
              "beskrivelse": "Romania",
              "oid": 80007
            },
            {
              "id": 3648,
              "verdi": "140",
              "beskrivelse": "Russland",
              "oid": 80007
            },
            {
              "id": 3649,
              "verdi": "129",
              "beskrivelse": "Luxembourg",
              "oid": 80007
            },
            {
              "id": 3650,
              "verdi": "124",
              "beskrivelse": "Latvia",
              "oid": 80007
            },
            {
              "id": 3651,
              "verdi": "130",
              "beskrivelse": "Monaco",
              "oid": 80007
            },
            {
              "id": 3652,
              "verdi": "138",
              "beskrivelse": "Moldova",
              "oid": 80007
            },
            {
              "id": 3653,
              "verdi": "156",
              "beskrivelse": "Makedonia",
              "oid": 80007
            },
            {
              "id": 3654,
              "verdi": "126",
              "beskrivelse": "Malta",
              "oid": 80007
            },
            {
              "id": 3655,
              "verdi": "121",
              "beskrivelse": "Irland",
              "oid": 80007
            },
            {
              "id": 3656,
              "verdi": "105",
              "beskrivelse": "Island",
              "oid": 80007
            },
            {
              "id": 3657,
              "verdi": "123",
              "beskrivelse": "Italia",
              "oid": 80007
            },
            {
              "id": 3658,
              "verdi": "480",
              "beskrivelse": "Kasahkstan",
              "oid": 80007
            },
            {
              "id": 3659,
              "verdi": "128",
              "beskrivelse": "Liechtenstein",
              "oid": 80007
            },
            {
              "id": 3660,
              "verdi": "136",
              "beskrivelse": "Litauen",
              "oid": 80007
            },
            {
              "id": 3661,
              "verdi": "139",
              "beskrivelse": "Storbritannia",
              "oid": 80007
            },
            {
              "id": 3662,
              "verdi": "430",
              "beskrivelse": "Georgia",
              "oid": 80007
            },
            {
              "id": 3663,
              "verdi": "102",
              "beskrivelse": "Grønland",
              "oid": 80007
            },
            {
              "id": 3664,
              "verdi": "119",
              "beskrivelse": "Hellas",
              "oid": 80007
            },
            {
              "id": 3665,
              "verdi": "122",
              "beskrivelse": "Kroatia",
              "oid": 80007
            },
            {
              "id": 3666,
              "verdi": "152",
              "beskrivelse": "Ungarn",
              "oid": 80007
            },
            {
              "id": 3667,
              "verdi": "101",
              "beskrivelse": "Danmark",
              "oid": 80007
            },
            {
              "id": 3668,
              "verdi": "115",
              "beskrivelse": "Estland",
              "oid": 80007
            },
            {
              "id": 3669,
              "verdi": "137",
              "beskrivelse": "Spania",
              "oid": 80007
            },
            {
              "id": 3670,
              "verdi": "103",
              "beskrivelse": "Finland",
              "oid": 80007
            },
            {
              "id": 3671,
              "verdi": "104",
              "beskrivelse": "Færøyene",
              "oid": 80007
            },
            {
              "id": 3672,
              "verdi": "117",
              "beskrivelse": "Frankrike",
              "oid": 80007
            },
            {
              "id": 3673,
              "verdi": "113",
              "beskrivelse": "Bulgaria",
              "oid": 80007
            },
            {
              "id": 3674,
              "verdi": "120",
              "beskrivelse": "Hviterussland",
              "oid": 80007
            },
            {
              "id": 3675,
              "verdi": "141",
              "beskrivelse": "Sveits",
              "oid": 80007
            },
            {
              "id": 3676,
              "verdi": "500",
              "beskrivelse": "Kypros",
              "oid": 80007
            },
            {
              "id": 3677,
              "verdi": "158",
              "beskrivelse": "Tsjekkia",
              "oid": 80007
            },
            {
              "id": 3678,
              "verdi": "144",
              "beskrivelse": "Tyskland",
              "oid": 80007
            },
            {
              "id": 3679,
              "verdi": "606",
              "beskrivelse": "Bermuda",
              "oid": 80007
            },
            {
              "id": 3680,
              "verdi": "612",
              "beskrivelse": "Canada",
              "oid": 80007
            },
            {
              "id": 3681,
              "verdi": "652",
              "beskrivelse": "Mexico",
              "oid": 80007
            },
            {
              "id": 3682,
              "verdi": "684",
              "beskrivelse": "USA",
              "oid": 80007
            },
            {
              "id": 3683,
              "verdi": "805",
              "beskrivelse": "Australia",
              "oid": 80007
            },
            {
              "id": 3684,
              "verdi": "811",
              "beskrivelse": "Fiji",
              "oid": 80007
            },
            {
              "id": 3685,
              "verdi": "817",
              "beskrivelse": "Guam",
              "oid": 80007
            },
            {
              "id": 3686,
              "verdi": "818",
              "beskrivelse": "Nauru",
              "oid": 80007
            },
            {
              "id": 3687,
              "verdi": "820",
              "beskrivelse": "Ny Zealand",
              "oid": 80007
            },
            {
              "id": 3688,
              "verdi": "813",
              "beskrivelse": "Tonga",
              "oid": 80007
            },
            {
              "id": 3689,
              "verdi": "812",
              "beskrivelse": "Vanuatu",
              "oid": 80007
            },
            {
              "id": 3690,
              "verdi": "830",
              "beskrivelse": "Samoa",
              "oid": 80007
            },
            {
              "id": 3691,
              "verdi": "656",
              "beskrivelse": "Nederlandske Antiller",
              "oid": 80007
            },
            {
              "id": 3692,
              "verdi": "705",
              "beskrivelse": "Argentina",
              "oid": 80007
            },
            {
              "id": 3693,
              "verdi": "602",
              "beskrivelse": "Barbados",
              "oid": 80007
            },
            {
              "id": 3694,
              "verdi": "710",
              "beskrivelse": "Bolivia",
              "oid": 80007
            },
            {
              "id": 3695,
              "verdi": "715",
              "beskrivelse": "Brasil",
              "oid": 80007
            },
            {
              "id": 3696,
              "verdi": "605",
              "beskrivelse": "Bahamas",
              "oid": 80007
            },
            {
              "id": 3697,
              "verdi": "603",
              "beskrivelse": "Antigua og Barbuda",
              "oid": 80007
            },
            {
              "id": 3698,
              "verdi": "678",
              "beskrivelse": "St. Lucia",
              "oid": 80007
            },
            {
              "id": 3699,
              "verdi": "755",
              "beskrivelse": "Paraguay",
              "oid": 80007
            },
            {
              "id": 3700,
              "verdi": "765",
              "beskrivelse": "Surinam",
              "oid": 80007
            },
            {
              "id": 3701,
              "verdi": "672",
              "beskrivelse": "El Salvador",
              "oid": 80007
            },
            {
              "id": 3702,
              "verdi": "680",
              "beskrivelse": "Trinidad og Tobago",
              "oid": 80007
            },
            {
              "id": 3703,
              "verdi": "770",
              "beskrivelse": "Uruguay",
              "oid": 80007
            },
            {
              "id": 3704,
              "verdi": "775",
              "beskrivelse": "Venezuela",
              "oid": 80007
            },
            {
              "id": 3705,
              "verdi": "636",
              "beskrivelse": "Haiti",
              "oid": 80007
            },
            {
              "id": 3706,
              "verdi": "648",
              "beskrivelse": "Jamaica",
              "oid": 80007
            },
            {
              "id": 3707,
              "verdi": "664",
              "beskrivelse": "Nicaragua",
              "oid": 80007
            },
            {
              "id": 3708,
              "verdi": "668",
              "beskrivelse": "Panama",
              "oid": 80007
            },
            {
              "id": 3709,
              "verdi": "760",
              "beskrivelse": "Peru",
              "oid": 80007
            },
            {
              "id": 3710,
              "verdi": "685",
              "beskrivelse": "Puerto Rico",
              "oid": 80007
            },
            {
              "id": 3711,
              "verdi": "735",
              "beskrivelse": "Ecuador",
              "oid": 80007
            },
            {
              "id": 3712,
              "verdi": "740",
              "beskrivelse": "Falklandsøyene",
              "oid": 80007
            },
            {
              "id": 3713,
              "verdi": "745",
              "beskrivelse": "Fransk Guyana",
              "oid": 80007
            },
            {
              "id": 3714,
              "verdi": "632",
              "beskrivelse": "Guatemala",
              "oid": 80007
            },
            {
              "id": 3715,
              "verdi": "720",
              "beskrivelse": "Guyana",
              "oid": 80007
            },
            {
              "id": 3716,
              "verdi": "644",
              "beskrivelse": "Honduras",
              "oid": 80007
            },
            {
              "id": 3717,
              "verdi": "604",
              "beskrivelse": "Belize",
              "oid": 80007
            },
            {
              "id": 3718,
              "verdi": "725",
              "beskrivelse": "Chile",
              "oid": 80007
            },
            {
              "id": 3719,
              "verdi": "730",
              "beskrivelse": "Colombia",
              "oid": 80007
            },
            {
              "id": 3720,
              "verdi": "616",
              "beskrivelse": "Costa Rica",
              "oid": 80007
            },
            {
              "id": 3721,
              "verdi": "620",
              "beskrivelse": "Cuba",
              "oid": 80007
            },
            {
              "id": 3722,
              "verdi": "624",
              "beskrivelse": "Dominikanske Republikk",
              "oid": 80007
            },
            {
              "id": 4486,
              "verdi": "806",
              "beskrivelse": "Salomonøyene",
              "oid": 80007
            },
            {
              "id": 5069,
              "verdi": "125",
              "beskrivelse": "Serbia og Montenegro",
              "oid": 80007
            },
            {
              "id": 5070,
              "verdi": "510",
              "beskrivelse": "Macao",
              "oid": 80007
            }
          ];


        var kommunerOgBydeler = [
            {
              "id": 2934,
              "verdi": "030101",
              "beskrivelse": "Gamle Oslo",
              "oid": 80021
            },
            {
              "id": 2936,
              "verdi": "030102",
              "beskrivelse": "Grünerløkka",
              "oid": 80021
            },
            {
              "id": 2938,
              "verdi": "030103",
              "beskrivelse": "Sagene",
              "oid": 80021
            },
            {
              "id": 2946,
              "verdi": "030116",
              "beskrivelse": "Oslo Sentrum",
              "oid": 80021
            },
            {
              "id": 2948,
              "verdi": "030117",
              "beskrivelse": "Oslo Marka",
              "oid": 80021
            },
            {
              "id": 2952,
              "verdi": "030113",
              "beskrivelse": "Østensjø",
              "oid": 80021
            },
            {
              "id": 2954,
              "verdi": "030114",
              "beskrivelse": "Nordstrand",
              "oid": 80021
            },
            {
              "id": 2956,
              "verdi": "030115",
              "beskrivelse": "Søndre Nordstrand",
              "oid": 80021
            },
            {
              "id": 2958,
              "verdi": "030110",
              "beskrivelse": "Grorud",
              "oid": 80021
            },
            {
              "id": 2960,
              "verdi": "030111",
              "beskrivelse": "Stovner",
              "oid": 80021
            },
            {
              "id": 2962,
              "verdi": "030112",
              "beskrivelse": "Alna",
              "oid": 80021
            },
            {
              "id": 2964,
              "verdi": "030107",
              "beskrivelse": "Vestre Aker",
              "oid": 80021
            },
            {
              "id": 2966,
              "verdi": "030108",
              "beskrivelse": "Nordre Aker",
              "oid": 80021
            },
            {
              "id": 2968,
              "verdi": "030109",
              "beskrivelse": "Bjerke",
              "oid": 80021
            },
            {
              "id": 2970,
              "verdi": "030104",
              "beskrivelse": "St.Hanshaugen",
              "oid": 80021
            },
            {
              "id": 2972,
              "verdi": "030105",
              "beskrivelse": "Frogner",
              "oid": 80021
            },
            {
              "id": 2974,
              "verdi": "030106",
              "beskrivelse": "Ullern",
              "oid": 80021
            },
            {
              "id": 4957,
              "verdi": "460101",
              "beskrivelse": "Arna",
              "oid": 80021
            },
            {
              "id": 4958,
              "verdi": "460102",
              "beskrivelse": "Bergenhus",
              "oid": 80021
            },
            {
              "id": 4959,
              "verdi": "460103",
              "beskrivelse": "Fana",
              "oid": 80021
            },
            {
              "id": 4960,
              "verdi": "460104",
              "beskrivelse": "Fyllingsdalen",
              "oid": 80021
            },
            {
              "id": 4961,
              "verdi": "460105",
              "beskrivelse": "Laksevåg",
              "oid": 80021
            },
            {
              "id": 4962,
              "verdi": "460106",
              "beskrivelse": "Ytrebygda",
              "oid": 80021
            },
            {
              "id": 4963,
              "verdi": "460107",
              "beskrivelse": "Årstad",
              "oid": 80021
            },
            {
              "id": 4964,
              "verdi": "460108",
              "beskrivelse": "Åsane",
              "oid": 80021
            },
            {
              "id": 3018,
              "verdi": "1101",
              "beskrivelse": "Eigersund",
              "oid": 80006
            },
            {
              "id": 3020,
              "verdi": "1103",
              "beskrivelse": "Stavanger",
              "oid": 80006
            },
            {
              "id": 3021,
              "verdi": "1106",
              "beskrivelse": "Haugesund",
              "oid": 80006
            },
            {
              "id": 3022,
              "verdi": "1111",
              "beskrivelse": "Sokndal",
              "oid": 80006
            },
            {
              "id": 3023,
              "verdi": "1112",
              "beskrivelse": "Lund",
              "oid": 80006
            },
            {
              "id": 3024,
              "verdi": "1151",
              "beskrivelse": "Utsira",
              "oid": 80006
            },
            {
              "id": 3027,
              "verdi": "1160",
              "beskrivelse": "Vindafjord",
              "oid": 80006
            },
            {
              "id": 3030,
              "verdi": "1144",
              "beskrivelse": "Kvitsøy",
              "oid": 80006
            },
            {
              "id": 3031,
              "verdi": "1145",
              "beskrivelse": "Bokn",
              "oid": 80006
            },
            {
              "id": 3032,
              "verdi": "1146",
              "beskrivelse": "Tysvær",
              "oid": 80006
            },
            {
              "id": 3033,
              "verdi": "1149",
              "beskrivelse": "Karmøy",
              "oid": 80006
            },
            {
              "id": 3034,
              "verdi": "1127",
              "beskrivelse": "Randaberg",
              "oid": 80006
            },
            {
              "id": 3036,
              "verdi": "1130",
              "beskrivelse": "Strand",
              "oid": 80006
            },
            {
              "id": 3037,
              "verdi": "1133",
              "beskrivelse": "Hjelmeland",
              "oid": 80006
            },
            {
              "id": 3038,
              "verdi": "1134",
              "beskrivelse": "Suldal",
              "oid": 80006
            },
            {
              "id": 3039,
              "verdi": "1135",
              "beskrivelse": "Sauda",
              "oid": 80006
            },
            {
              "id": 3040,
              "verdi": "1114",
              "beskrivelse": "Bjerkreim",
              "oid": 80006
            },
            {
              "id": 3041,
              "verdi": "1119",
              "beskrivelse": "Hå",
              "oid": 80006
            },
            {
              "id": 3042,
              "verdi": "1120",
              "beskrivelse": "Klepp",
              "oid": 80006
            },
            {
              "id": 3043,
              "verdi": "1121",
              "beskrivelse": "Time",
              "oid": 80006
            },
            {
              "id": 3044,
              "verdi": "1122",
              "beskrivelse": "Gjesdal",
              "oid": 80006
            },
            {
              "id": 3045,
              "verdi": "1124",
              "beskrivelse": "Sola",
              "oid": 80006
            },
            {
              "id": 3089,
              "verdi": "0301",
              "beskrivelse": "Oslo (k)",
              "oid": 80006
            },
            {
              "id": 3109,
              "verdi": "5001",
              "beskrivelse": "Trondheim",
              "oid": 80006
            },
            {
              "id": 3112,
              "verdi": "5054",
              "beskrivelse": "Indre Fosen",
              "oid": 80006
            },
            {
              "id": 3115,
              "verdi": "5049",
              "beskrivelse": "Flatanger",
              "oid": 80006
            },
            {
              "id": 3118,
              "verdi": "5052",
              "beskrivelse": "Leka",
              "oid": 80006
            },
            {
              "id": 3119,
              "verdi": "5053",
              "beskrivelse": "Inderøy",
              "oid": 80006
            },
            {
              "id": 3120,
              "verdi": "5043",
              "beskrivelse": "Røyrvik",
              "oid": 80006
            },
            {
              "id": 3121,
              "verdi": "5044",
              "beskrivelse": "Namsskogan",
              "oid": 80006
            },
            {
              "id": 3122,
              "verdi": "5045",
              "beskrivelse": "Grong",
              "oid": 80006
            },
            {
              "id": 3123,
              "verdi": "5046",
              "beskrivelse": "Høylandet",
              "oid": 80006
            },
            {
              "id": 3124,
              "verdi": "5047",
              "beskrivelse": "Overhalla",
              "oid": 80006
            },
            {
              "id": 3126,
              "verdi": "5037",
              "beskrivelse": "Levanger",
              "oid": 80006
            },
            {
              "id": 3127,
              "verdi": "5038",
              "beskrivelse": "Verdal",
              "oid": 80006
            },
            {
              "id": 3130,
              "verdi": "5041",
              "beskrivelse": "Snåsa",
              "oid": 80006
            },
            {
              "id": 3131,
              "verdi": "5042",
              "beskrivelse": "Lierne",
              "oid": 80006
            },
            {
              "id": 3132,
              "verdi": "5031",
              "beskrivelse": "Malvik",
              "oid": 80006
            },
            {
              "id": 3133,
              "verdi": "5032",
              "beskrivelse": "Selbu",
              "oid": 80006
            },
            {
              "id": 3134,
              "verdi": "5033",
              "beskrivelse": "Tydal",
              "oid": 80006
            },
            {
              "id": 3135,
              "verdi": "5034",
              "beskrivelse": "Meråker",
              "oid": 80006
            },
            {
              "id": 3136,
              "verdi": "5035",
              "beskrivelse": "Stjørdal",
              "oid": 80006
            },
            {
              "id": 3137,
              "verdi": "5036",
              "beskrivelse": "Frosta",
              "oid": 80006
            },
            {
              "id": 3138,
              "verdi": "5025",
              "beskrivelse": "Røros",
              "oid": 80006
            },
            {
              "id": 3139,
              "verdi": "5026",
              "beskrivelse": "Holtålen",
              "oid": 80006
            },
            {
              "id": 3140,
              "verdi": "5027",
              "beskrivelse": "Midtre Gauldal",
              "oid": 80006
            },
            {
              "id": 3141,
              "verdi": "5028",
              "beskrivelse": "Melhus",
              "oid": 80006
            },
            {
              "id": 3142,
              "verdi": "5029",
              "beskrivelse": "Skaun",
              "oid": 80006
            },
            {
              "id": 3145,
              "verdi": "5020",
              "beskrivelse": "Osen",
              "oid": 80006
            },
            {
              "id": 3146,
              "verdi": "5021",
              "beskrivelse": "Oppdal",
              "oid": 80006
            },
            {
              "id": 3147,
              "verdi": "5022",
              "beskrivelse": "Rennebu",
              "oid": 80006
            },
            {
              "id": 3151,
              "verdi": "5014",
              "beskrivelse": "Frøya",
              "oid": 80006
            },
            {
              "id": 3156,
              "verdi": "2110",
              "beskrivelse": "Svalbard",
              "oid": 80006
            },
            {
              "id": 3157,
              "verdi": "2121",
              "beskrivelse": "Bjørnøya",
              "oid": 80006
            },
            {
              "id": 3158,
              "verdi": "2131",
              "beskrivelse": "Hopen",
              "oid": 80006
            },
            {
              "id": 3159,
              "verdi": "2211",
              "beskrivelse": "Jan Mayen",
              "oid": 80006
            },
            {
              "id": 3160,
              "verdi": "2310",
              "beskrivelse": "Kontinentalsokkelen",
              "oid": 80006
            },
            {
              "id": 3161,
              "verdi": "2311",
              "beskrivelse": "Sokkelen sør for 62 grader",
              "oid": 80006
            },
            {
              "id": 3162,
              "verdi": "2321",
              "beskrivelse": "Sokkelen nord for 62 grader",
              "oid": 80006
            },
            {
              "id": 3163,
              "verdi": "2111",
              "beskrivelse": "Spitsbergen",
              "oid": 80006
            },
            {
              "id": 3164,
              "verdi": "2100",
              "beskrivelse": "Utenfor Fastlands-Norge",
              "oid": 80006
            },
            {
              "id": 3165,
              "verdi": "9999",
              "beskrivelse": "Ukjent kommune",
              "oid": 80006
            },
            {
              "id": 3332,
              "verdi": "1505",
              "beskrivelse": "Kristiansund",
              "oid": 80006
            },
            {
              "id": 3334,
              "verdi": "1511",
              "beskrivelse": "Vanylven",
              "oid": 80006
            },
            {
              "id": 3335,
              "verdi": "1514",
              "beskrivelse": "Sande i M og R",
              "oid": 80006
            },
            {
              "id": 3336,
              "verdi": "1515",
              "beskrivelse": "Herøy i M og R",
              "oid": 80006
            },
            {
              "id": 3338,
              "verdi": "1573",
              "beskrivelse": "Smøla",
              "oid": 80006
            },
            {
              "id": 3339,
              "verdi": "1576",
              "beskrivelse": "Aure",
              "oid": 80006
            },
            {
              "id": 3340,
              "verdi": "1560",
              "beskrivelse": "Tingvoll",
              "oid": 80006
            },
            {
              "id": 3341,
              "verdi": "1563",
              "beskrivelse": "Sunndal",
              "oid": 80006
            },
            {
              "id": 3342,
              "verdi": "1566",
              "beskrivelse": "Surnadal",
              "oid": 80006
            },
            {
              "id": 3346,
              "verdi": "1547",
              "beskrivelse": "Aukra",
              "oid": 80006
            },
            {
              "id": 3349,
              "verdi": "1554",
              "beskrivelse": "Averøy",
              "oid": 80006
            },
            {
              "id": 3351,
              "verdi": "1557",
              "beskrivelse": "Gjemnes",
              "oid": 80006
            },
            {
              "id": 3353,
              "verdi": "1535",
              "beskrivelse": "Vestnes",
              "oid": 80006
            },
            {
              "id": 3354,
              "verdi": "1539",
              "beskrivelse": "Rauma",
              "oid": 80006
            },
            {
              "id": 3358,
              "verdi": "1525",
              "beskrivelse": "Stranda",
              "oid": 80006
            },
            {
              "id": 3360,
              "verdi": "1528",
              "beskrivelse": "Sykkylven",
              "oid": 80006
            },
            {
              "id": 3362,
              "verdi": "1531",
              "beskrivelse": "Sula",
              "oid": 80006
            },
            {
              "id": 3363,
              "verdi": "1532",
              "beskrivelse": "Giske",
              "oid": 80006
            },
            {
              "id": 3364,
              "verdi": "1516",
              "beskrivelse": "Ulstein",
              "oid": 80006
            },
            {
              "id": 3365,
              "verdi": "1517",
              "beskrivelse": "Hareid",
              "oid": 80006
            },
            {
              "id": 3367,
              "verdi": "1520",
              "beskrivelse": "Ørsta",
              "oid": 80006
            },
            {
              "id": 3420,
              "verdi": "1804",
              "beskrivelse": "Bodø",
              "oid": 80006
            },
            {
              "id": 3422,
              "verdi": "1811",
              "beskrivelse": "Bindal",
              "oid": 80006
            },
            {
              "id": 3423,
              "verdi": "1812",
              "beskrivelse": "Sømna",
              "oid": 80006
            },
            {
              "id": 3424,
              "verdi": "1813",
              "beskrivelse": "Brønnøy",
              "oid": 80006
            },
            {
              "id": 3425,
              "verdi": "1815",
              "beskrivelse": "Vega",
              "oid": 80006
            },
            {
              "id": 3426,
              "verdi": "1870",
              "beskrivelse": "Sortland",
              "oid": 80006
            },
            {
              "id": 3427,
              "verdi": "1871",
              "beskrivelse": "Andøy",
              "oid": 80006
            },
            {
              "id": 3428,
              "verdi": "1874",
              "beskrivelse": "Moskenes",
              "oid": 80006
            },
            {
              "id": 3429,
              "verdi": "1859",
              "beskrivelse": "Flakstad",
              "oid": 80006
            },
            {
              "id": 3430,
              "verdi": "1860",
              "beskrivelse": "Vestvågøy",
              "oid": 80006
            },
            {
              "id": 3431,
              "verdi": "1865",
              "beskrivelse": "Vågan",
              "oid": 80006
            },
            {
              "id": 3432,
              "verdi": "1866",
              "beskrivelse": "Hadsel",
              "oid": 80006
            },
            {
              "id": 3433,
              "verdi": "1867",
              "beskrivelse": "Bø i Vesterålen",
              "oid": 80006
            },
            {
              "id": 3434,
              "verdi": "1868",
              "beskrivelse": "Øksnes",
              "oid": 80006
            },
            {
              "id": 3435,
              "verdi": "1851",
              "beskrivelse": "Lødingen",
              "oid": 80006
            },
            {
              "id": 3437,
              "verdi": "1853",
              "beskrivelse": "Evenes",
              "oid": 80006
            },
            {
              "id": 3439,
              "verdi": "1856",
              "beskrivelse": "Røst",
              "oid": 80006
            },
            {
              "id": 3440,
              "verdi": "1857",
              "beskrivelse": "Værøy",
              "oid": 80006
            },
            {
              "id": 3441,
              "verdi": "1841",
              "beskrivelse": "Fauske",
              "oid": 80006
            },
            {
              "id": 3442,
              "verdi": "1842",
              "beskrivelse": "Skjerstad",
              "oid": 80006
            },
            {
              "id": 3443,
              "verdi": "1845",
              "beskrivelse": "Sørfold",
              "oid": 80006
            },
            {
              "id": 3444,
              "verdi": "1848",
              "beskrivelse": "Steigen",
              "oid": 80006
            },
            {
              "id": 3447,
              "verdi": "1835",
              "beskrivelse": "Træna",
              "oid": 80006
            },
            {
              "id": 3448,
              "verdi": "1836",
              "beskrivelse": "Rødøy",
              "oid": 80006
            },
            {
              "id": 3449,
              "verdi": "1837",
              "beskrivelse": "Meløy",
              "oid": 80006
            },
            {
              "id": 3450,
              "verdi": "1838",
              "beskrivelse": "Gildeskål",
              "oid": 80006
            },
            {
              "id": 3451,
              "verdi": "1839",
              "beskrivelse": "Beiarn",
              "oid": 80006
            },
            {
              "id": 3452,
              "verdi": "1840",
              "beskrivelse": "Saltdal",
              "oid": 80006
            },
            {
              "id": 3453,
              "verdi": "1826",
              "beskrivelse": "Hattfjelldal",
              "oid": 80006
            },
            {
              "id": 3454,
              "verdi": "1827",
              "beskrivelse": "Dønna",
              "oid": 80006
            },
            {
              "id": 3455,
              "verdi": "1828",
              "beskrivelse": "Nesna",
              "oid": 80006
            },
            {
              "id": 3456,
              "verdi": "1832",
              "beskrivelse": "Hemnes",
              "oid": 80006
            },
            {
              "id": 3457,
              "verdi": "1833",
              "beskrivelse": "Rana",
              "oid": 80006
            },
            {
              "id": 3458,
              "verdi": "1834",
              "beskrivelse": "Lurøy",
              "oid": 80006
            },
            {
              "id": 3459,
              "verdi": "1816",
              "beskrivelse": "Vevelstad",
              "oid": 80006
            },
            {
              "id": 3460,
              "verdi": "1818",
              "beskrivelse": "Herøy i Nordland",
              "oid": 80006
            },
            {
              "id": 3461,
              "verdi": "1820",
              "beskrivelse": "Alstahaug",
              "oid": 80006
            },
            {
              "id": 3462,
              "verdi": "1822",
              "beskrivelse": "Leirfjord",
              "oid": 80006
            },
            {
              "id": 3463,
              "verdi": "1824",
              "beskrivelse": "Vefsn",
              "oid": 80006
            },
            {
              "id": 3464,
              "verdi": "1825",
              "beskrivelse": "Grane",
              "oid": 80006
            },
            {
              "id": 4487,
              "verdi": "5061",
              "beskrivelse": "Rindal",
              "oid": 80006
            },
            {
              "id": 4712,
              "verdi": "4640",
              "beskrivelse": "Sogndal",
              "oid": 80006
            },
            {
              "id": 4713,
              "verdi": "4649",
              "beskrivelse": "Stad",
              "oid": 80006
            },
            {
              "id": 4714,
              "verdi": "4626",
              "beskrivelse": "Øygarden",
              "oid": 80006
            },
            {
              "id": 4715,
              "verdi": "4602",
              "beskrivelse": "Kinn",
              "oid": 80006
            },
            {
              "id": 4716,
              "verdi": "4624",
              "beskrivelse": "Bjørnafjorden",
              "oid": 80006
            },
            {
              "id": 4717,
              "verdi": "4601",
              "beskrivelse": "Bergen",
              "oid": 80006
            },
            {
              "id": 4718,
              "verdi": "1108",
              "beskrivelse": "Sandnes",
              "oid": 80006
            },
            {
              "id": 4719,
              "verdi": "4611",
              "beskrivelse": "Etne",
              "oid": 80006
            },
            {
              "id": 4720,
              "verdi": "4612",
              "beskrivelse": "Sveio",
              "oid": 80006
            },
            {
              "id": 4721,
              "verdi": "1506",
              "beskrivelse": "Molde",
              "oid": 80006
            },
            {
              "id": 4722,
              "verdi": "4225",
              "beskrivelse": "Lyngdal",
              "oid": 80006
            },
            {
              "id": 4723,
              "verdi": "4613",
              "beskrivelse": "Bømlo",
              "oid": 80006
            },
            {
              "id": 4724,
              "verdi": "1507",
              "beskrivelse": "Ålesund",
              "oid": 80006
            },
            {
              "id": 4725,
              "verdi": "4614",
              "beskrivelse": "Stord",
              "oid": 80006
            },
            {
              "id": 4726,
              "verdi": "1577",
              "beskrivelse": "Volda",
              "oid": 80006
            },
            {
              "id": 4727,
              "verdi": "3817",
              "beskrivelse": "Midt-Telemark",
              "oid": 80006
            },
            {
              "id": 4728,
              "verdi": "1578",
              "beskrivelse": "Fjord",
              "oid": 80006
            },
            {
              "id": 4729,
              "verdi": "4615",
              "beskrivelse": "Fitjar",
              "oid": 80006
            },
            {
              "id": 4730,
              "verdi": "1579",
              "beskrivelse": "Hustadvika",
              "oid": 80006
            },
            {
              "id": 4731,
              "verdi": "4205",
              "beskrivelse": "Lindesnes",
              "oid": 80006
            },
            {
              "id": 4732,
              "verdi": "1806",
              "beskrivelse": "Narvik",
              "oid": 80006
            },
            {
              "id": 4733,
              "verdi": "4616",
              "beskrivelse": "Tysnes",
              "oid": 80006
            },
            {
              "id": 4734,
              "verdi": "4617",
              "beskrivelse": "Kvinnherad",
              "oid": 80006
            },
            {
              "id": 4735,
              "verdi": "1875",
              "beskrivelse": "Hamarøy",
              "oid": 80006
            },
            {
              "id": 4736,
              "verdi": "4618",
              "beskrivelse": "Ullensvang",
              "oid": 80006
            },
            {
              "id": 4737,
              "verdi": "3001",
              "beskrivelse": "Halden",
              "oid": 80006
            },
            {
              "id": 4738,
              "verdi": "3002",
              "beskrivelse": "Moss",
              "oid": 80006
            },
            {
              "id": 4739,
              "verdi": "4619",
              "beskrivelse": "Eidfjord",
              "oid": 80006
            },
            {
              "id": 4740,
              "verdi": "3401",
              "beskrivelse": "Kongsvinger",
              "oid": 80006
            },
            {
              "id": 4741,
              "verdi": "3003",
              "beskrivelse": "Sarpsborg",
              "oid": 80006
            },
            {
              "id": 4742,
              "verdi": "4620",
              "beskrivelse": "Ulvik",
              "oid": 80006
            },
            {
              "id": 4743,
              "verdi": "3004",
              "beskrivelse": "Fredrikstad",
              "oid": 80006
            },
            {
              "id": 4744,
              "verdi": "3403",
              "beskrivelse": "Hamar",
              "oid": 80006
            },
            {
              "id": 4745,
              "verdi": "4621",
              "beskrivelse": "Voss",
              "oid": 80006
            },
            {
              "id": 4746,
              "verdi": "3005",
              "beskrivelse": "Drammen",
              "oid": 80006
            },
            {
              "id": 4747,
              "verdi": "3405",
              "beskrivelse": "Lillehammer",
              "oid": 80006
            },
            {
              "id": 4748,
              "verdi": "3006",
              "beskrivelse": "Kongsberg",
              "oid": 80006
            },
            {
              "id": 4749,
              "verdi": "4622",
              "beskrivelse": "Kvam",
              "oid": 80006
            },
            {
              "id": 4750,
              "verdi": "3407",
              "beskrivelse": "Gjøvik",
              "oid": 80006
            },
            {
              "id": 4751,
              "verdi": "4623",
              "beskrivelse": "Samnanger",
              "oid": 80006
            },
            {
              "id": 4752,
              "verdi": "3007",
              "beskrivelse": "Ringerike",
              "oid": 80006
            },
            {
              "id": 4753,
              "verdi": "3011",
              "beskrivelse": "Hvaler",
              "oid": 80006
            },
            {
              "id": 4754,
              "verdi": "4625",
              "beskrivelse": "Austevoll",
              "oid": 80006
            },
            {
              "id": 4755,
              "verdi": "3411",
              "beskrivelse": "Ringsaker",
              "oid": 80006
            },
            {
              "id": 4756,
              "verdi": "3012",
              "beskrivelse": "Aremark",
              "oid": 80006
            },
            {
              "id": 4757,
              "verdi": "4627",
              "beskrivelse": "Askøy",
              "oid": 80006
            },
            {
              "id": 4758,
              "verdi": "3013",
              "beskrivelse": "Marker",
              "oid": 80006
            },
            {
              "id": 4759,
              "verdi": "3412",
              "beskrivelse": "Løten",
              "oid": 80006
            },
            {
              "id": 4760,
              "verdi": "3014",
              "beskrivelse": "Indre Østfold",
              "oid": 80006
            },
            {
              "id": 4761,
              "verdi": "4628",
              "beskrivelse": "Vaksdal",
              "oid": 80006
            },
            {
              "id": 4762,
              "verdi": "3413",
              "beskrivelse": "Stange",
              "oid": 80006
            },
            {
              "id": 4763,
              "verdi": "3015",
              "beskrivelse": "Skiptvet",
              "oid": 80006
            },
            {
              "id": 4764,
              "verdi": "3016",
              "beskrivelse": "Rakkestad",
              "oid": 80006
            },
            {
              "id": 4765,
              "verdi": "3017",
              "beskrivelse": "Råde",
              "oid": 80006
            },
            {
              "id": 4766,
              "verdi": "4629",
              "beskrivelse": "Modalen",
              "oid": 80006
            },
            {
              "id": 4767,
              "verdi": "4630",
              "beskrivelse": "Osterøy",
              "oid": 80006
            },
            {
              "id": 4768,
              "verdi": "3018",
              "beskrivelse": "Våler (Viken)",
              "oid": 80006
            },
            {
              "id": 4769,
              "verdi": "4631",
              "beskrivelse": "Alver",
              "oid": 80006
            },
            {
              "id": 4770,
              "verdi": "3019",
              "beskrivelse": "Vestby",
              "oid": 80006
            },
            {
              "id": 4771,
              "verdi": "3020",
              "beskrivelse": "Nordre Follo",
              "oid": 80006
            },
            {
              "id": 4772,
              "verdi": "3414",
              "beskrivelse": "Nord-Odal",
              "oid": 80006
            },
            {
              "id": 4773,
              "verdi": "4632",
              "beskrivelse": "Austrheim",
              "oid": 80006
            },
            {
              "id": 4774,
              "verdi": "3415",
              "beskrivelse": "Sør-Odal",
              "oid": 80006
            },
            {
              "id": 4775,
              "verdi": "3021",
              "beskrivelse": "Ås",
              "oid": 80006
            },
            {
              "id": 4776,
              "verdi": "4633",
              "beskrivelse": "Fedje",
              "oid": 80006
            },
            {
              "id": 4777,
              "verdi": "3022",
              "beskrivelse": "Frogn",
              "oid": 80006
            },
            {
              "id": 4778,
              "verdi": "3416",
              "beskrivelse": "Eidskog",
              "oid": 80006
            },
            {
              "id": 4779,
              "verdi": "3023",
              "beskrivelse": "Nesodden",
              "oid": 80006
            },
            {
              "id": 4780,
              "verdi": "4634",
              "beskrivelse": "Masfjorden",
              "oid": 80006
            },
            {
              "id": 4781,
              "verdi": "3417",
              "beskrivelse": "Grue",
              "oid": 80006
            },
            {
              "id": 4782,
              "verdi": "4635",
              "beskrivelse": "Gulen",
              "oid": 80006
            },
            {
              "id": 4783,
              "verdi": "3024",
              "beskrivelse": "Bærum",
              "oid": 80006
            },
            {
              "id": 4784,
              "verdi": "3025",
              "beskrivelse": "Asker",
              "oid": 80006
            },
            {
              "id": 4785,
              "verdi": "3418",
              "beskrivelse": "Åsnes",
              "oid": 80006
            },
            {
              "id": 4786,
              "verdi": "3026",
              "beskrivelse": "Aurskog-Høland",
              "oid": 80006
            },
            {
              "id": 4787,
              "verdi": "3027",
              "beskrivelse": "Rælingen",
              "oid": 80006
            },
            {
              "id": 4788,
              "verdi": "3419",
              "beskrivelse": "Våler (Innlandet)",
              "oid": 80006
            },
            {
              "id": 4789,
              "verdi": "4636",
              "beskrivelse": "Solund",
              "oid": 80006
            },
            {
              "id": 4790,
              "verdi": "3028",
              "beskrivelse": "Enebakk",
              "oid": 80006
            },
            {
              "id": 4791,
              "verdi": "4637",
              "beskrivelse": "Hyllestad",
              "oid": 80006
            },
            {
              "id": 4792,
              "verdi": "3420",
              "beskrivelse": "Elverum",
              "oid": 80006
            },
            {
              "id": 4793,
              "verdi": "3029",
              "beskrivelse": "Lørenskog",
              "oid": 80006
            },
            {
              "id": 4794,
              "verdi": "4638",
              "beskrivelse": "Høyanger",
              "oid": 80006
            },
            {
              "id": 4795,
              "verdi": "3030",
              "beskrivelse": "Lillestrøm",
              "oid": 80006
            },
            {
              "id": 4796,
              "verdi": "3421",
              "beskrivelse": "Trysil",
              "oid": 80006
            },
            {
              "id": 4797,
              "verdi": "3031",
              "beskrivelse": "Nittedal",
              "oid": 80006
            },
            {
              "id": 4798,
              "verdi": "4639",
              "beskrivelse": "Vik",
              "oid": 80006
            },
            {
              "id": 4799,
              "verdi": "3422",
              "beskrivelse": "Åmot",
              "oid": 80006
            },
            {
              "id": 4800,
              "verdi": "3032",
              "beskrivelse": "Gjerdrum",
              "oid": 80006
            },
            {
              "id": 4801,
              "verdi": "4641",
              "beskrivelse": "Aurland",
              "oid": 80006
            },
            {
              "id": 4802,
              "verdi": "3423",
              "beskrivelse": "Stor-Elvdal",
              "oid": 80006
            },
            {
              "id": 4803,
              "verdi": "3424",
              "beskrivelse": "Rendalen",
              "oid": 80006
            },
            {
              "id": 4804,
              "verdi": "4642",
              "beskrivelse": "Lærdal",
              "oid": 80006
            },
            {
              "id": 4805,
              "verdi": "3425",
              "beskrivelse": "Engerdal",
              "oid": 80006
            },
            {
              "id": 4806,
              "verdi": "4643",
              "beskrivelse": "Årdal",
              "oid": 80006
            },
            {
              "id": 4807,
              "verdi": "3426",
              "beskrivelse": "Tolga",
              "oid": 80006
            },
            {
              "id": 4808,
              "verdi": "4644",
              "beskrivelse": "Luster",
              "oid": 80006
            },
            {
              "id": 4809,
              "verdi": "3427",
              "beskrivelse": "Tynset",
              "oid": 80006
            },
            {
              "id": 4810,
              "verdi": "3033",
              "beskrivelse": "Ullensaker",
              "oid": 80006
            },
            {
              "id": 4811,
              "verdi": "3034",
              "beskrivelse": "Nes",
              "oid": 80006
            },
            {
              "id": 4812,
              "verdi": "4645",
              "beskrivelse": "Askvoll",
              "oid": 80006
            },
            {
              "id": 4813,
              "verdi": "3428",
              "beskrivelse": "Alvdal",
              "oid": 80006
            },
            {
              "id": 4814,
              "verdi": "3035",
              "beskrivelse": "Eidsvoll",
              "oid": 80006
            },
            {
              "id": 4815,
              "verdi": "3036",
              "beskrivelse": "Nannestad",
              "oid": 80006
            },
            {
              "id": 4816,
              "verdi": "3037",
              "beskrivelse": "Hurdal",
              "oid": 80006
            },
            {
              "id": 4817,
              "verdi": "4646",
              "beskrivelse": "Fjaler",
              "oid": 80006
            },
            {
              "id": 4818,
              "verdi": "3038",
              "beskrivelse": "Hole",
              "oid": 80006
            },
            {
              "id": 4819,
              "verdi": "3429",
              "beskrivelse": "Folldal",
              "oid": 80006
            },
            {
              "id": 4820,
              "verdi": "4647",
              "beskrivelse": "Sunnfjord",
              "oid": 80006
            },
            {
              "id": 4821,
              "verdi": "3039",
              "beskrivelse": "Flå",
              "oid": 80006
            },
            {
              "id": 4822,
              "verdi": "3040",
              "beskrivelse": "Nesbyen",
              "oid": 80006
            },
            {
              "id": 4823,
              "verdi": "4648",
              "beskrivelse": "Bremanger",
              "oid": 80006
            },
            {
              "id": 4824,
              "verdi": "3041",
              "beskrivelse": "Gol",
              "oid": 80006
            },
            {
              "id": 4825,
              "verdi": "3430",
              "beskrivelse": "Os",
              "oid": 80006
            },
            {
              "id": 4826,
              "verdi": "3042",
              "beskrivelse": "Hemsedal",
              "oid": 80006
            },
            {
              "id": 4827,
              "verdi": "4650",
              "beskrivelse": "Gloppen",
              "oid": 80006
            },
            {
              "id": 4828,
              "verdi": "3431",
              "beskrivelse": "Dovre",
              "oid": 80006
            },
            {
              "id": 4829,
              "verdi": "3043",
              "beskrivelse": "Ål",
              "oid": 80006
            },
            {
              "id": 4830,
              "verdi": "3432",
              "beskrivelse": "Lesja",
              "oid": 80006
            },
            {
              "id": 4831,
              "verdi": "4651",
              "beskrivelse": "Stryn",
              "oid": 80006
            },
            {
              "id": 4832,
              "verdi": "3044",
              "beskrivelse": "Hol",
              "oid": 80006
            },
            {
              "id": 4833,
              "verdi": "3045",
              "beskrivelse": "Sigdal",
              "oid": 80006
            },
            {
              "id": 4834,
              "verdi": "3433",
              "beskrivelse": "Skjåk",
              "oid": 80006
            },
            {
              "id": 4835,
              "verdi": "3046",
              "beskrivelse": "Krødsherad",
              "oid": 80006
            },
            {
              "id": 4836,
              "verdi": "3434",
              "beskrivelse": "Lom",
              "oid": 80006
            },
            {
              "id": 4837,
              "verdi": "3047",
              "beskrivelse": "Modum",
              "oid": 80006
            },
            {
              "id": 4838,
              "verdi": "3435",
              "beskrivelse": "Vågå",
              "oid": 80006
            },
            {
              "id": 4839,
              "verdi": "3436",
              "beskrivelse": "Nord-Fron",
              "oid": 80006
            },
            {
              "id": 4840,
              "verdi": "3437",
              "beskrivelse": "Sel",
              "oid": 80006
            },
            {
              "id": 4841,
              "verdi": "3048",
              "beskrivelse": "Øvre Eiker",
              "oid": 80006
            },
            {
              "id": 4842,
              "verdi": "3049",
              "beskrivelse": "Lier",
              "oid": 80006
            },
            {
              "id": 4843,
              "verdi": "3438",
              "beskrivelse": "Sør-Fron",
              "oid": 80006
            },
            {
              "id": 4844,
              "verdi": "3050",
              "beskrivelse": "Flesberg",
              "oid": 80006
            },
            {
              "id": 4845,
              "verdi": "3051",
              "beskrivelse": "Rollag",
              "oid": 80006
            },
            {
              "id": 4846,
              "verdi": "3052",
              "beskrivelse": "Nore og Uvdal",
              "oid": 80006
            },
            {
              "id": 4847,
              "verdi": "3439",
              "beskrivelse": "Ringebu",
              "oid": 80006
            },
            {
              "id": 4848,
              "verdi": "3053",
              "beskrivelse": "Jevnaker",
              "oid": 80006
            },
            {
              "id": 4849,
              "verdi": "3440",
              "beskrivelse": "Øyer",
              "oid": 80006
            },
            {
              "id": 4850,
              "verdi": "3054",
              "beskrivelse": "Lunner",
              "oid": 80006
            },
            {
              "id": 4851,
              "verdi": "3441",
              "beskrivelse": "Gausdal",
              "oid": 80006
            },
            {
              "id": 4852,
              "verdi": "5401",
              "beskrivelse": "Tromsø",
              "oid": 80006
            },
            {
              "id": 4853,
              "verdi": "3442",
              "beskrivelse": "Østre Toten",
              "oid": 80006
            },
            {
              "id": 4854,
              "verdi": "3443",
              "beskrivelse": "Vestre Toten",
              "oid": 80006
            },
            {
              "id": 4855,
              "verdi": "5402",
              "beskrivelse": "Harstad",
              "oid": 80006
            },
            {
              "id": 4856,
              "verdi": "3446",
              "beskrivelse": "Gran",
              "oid": 80006
            },
            {
              "id": 4857,
              "verdi": "5403",
              "beskrivelse": "Alta",
              "oid": 80006
            },
            {
              "id": 4858,
              "verdi": "5404",
              "beskrivelse": "Vardø",
              "oid": 80006
            },
            {
              "id": 4859,
              "verdi": "5405",
              "beskrivelse": "Vadsø",
              "oid": 80006
            },
            {
              "id": 4860,
              "verdi": "3447",
              "beskrivelse": "Søndre Land",
              "oid": 80006
            },
            {
              "id": 4861,
              "verdi": "5406",
              "beskrivelse": "Hammerfest",
              "oid": 80006
            },
            {
              "id": 4862,
              "verdi": "3448",
              "beskrivelse": "Nordre Land",
              "oid": 80006
            },
            {
              "id": 4863,
              "verdi": "5006",
              "beskrivelse": "Steinkjer",
              "oid": 80006
            },
            {
              "id": 4864,
              "verdi": "3449",
              "beskrivelse": "Sør-Aurdal",
              "oid": 80006
            },
            {
              "id": 4865,
              "verdi": "3450",
              "beskrivelse": "Etnedal",
              "oid": 80006
            },
            {
              "id": 4866,
              "verdi": "3451",
              "beskrivelse": "Nord-Aurdal",
              "oid": 80006
            },
            {
              "id": 4867,
              "verdi": "5007",
              "beskrivelse": "Namsos",
              "oid": 80006
            },
            {
              "id": 4868,
              "verdi": "5411",
              "beskrivelse": "Kvæfjord",
              "oid": 80006
            },
            {
              "id": 4869,
              "verdi": "3452",
              "beskrivelse": "Vestre Slidre",
              "oid": 80006
            },
            {
              "id": 4870,
              "verdi": "5412",
              "beskrivelse": "Tjeldsund",
              "oid": 80006
            },
            {
              "id": 4871,
              "verdi": "5055",
              "beskrivelse": "Heim",
              "oid": 80006
            },
            {
              "id": 4872,
              "verdi": "5413",
              "beskrivelse": "Ibestad",
              "oid": 80006
            },
            {
              "id": 4873,
              "verdi": "5414",
              "beskrivelse": "Gratangen",
              "oid": 80006
            },
            {
              "id": 4874,
              "verdi": "3453",
              "beskrivelse": "Øystre Slidre",
              "oid": 80006
            },
            {
              "id": 4875,
              "verdi": "5056",
              "beskrivelse": "Hitra",
              "oid": 80006
            },
            {
              "id": 4876,
              "verdi": "5415",
              "beskrivelse": "Lavangen",
              "oid": 80006
            },
            {
              "id": 4877,
              "verdi": "3454",
              "beskrivelse": "Vang",
              "oid": 80006
            },
            {
              "id": 4878,
              "verdi": "5057",
              "beskrivelse": "Ørland",
              "oid": 80006
            },
            {
              "id": 4879,
              "verdi": "5416",
              "beskrivelse": "Bardu",
              "oid": 80006
            },
            {
              "id": 4880,
              "verdi": "5417",
              "beskrivelse": "Salangen",
              "oid": 80006
            },
            {
              "id": 4881,
              "verdi": "5058",
              "beskrivelse": "Åfjord",
              "oid": 80006
            },
            {
              "id": 4882,
              "verdi": "3801",
              "beskrivelse": "Horten",
              "oid": 80006
            },
            {
              "id": 4883,
              "verdi": "5418",
              "beskrivelse": "Målselv",
              "oid": 80006
            },
            {
              "id": 4884,
              "verdi": "5419",
              "beskrivelse": "Sørreisa",
              "oid": 80006
            },
            {
              "id": 4885,
              "verdi": "5059",
              "beskrivelse": "Orkland",
              "oid": 80006
            },
            {
              "id": 4886,
              "verdi": "3802",
              "beskrivelse": "Holmestrand",
              "oid": 80006
            },
            {
              "id": 4887,
              "verdi": "5420",
              "beskrivelse": "Dyrøy",
              "oid": 80006
            },
            {
              "id": 4888,
              "verdi": "5421",
              "beskrivelse": "Senja",
              "oid": 80006
            },
            {
              "id": 4889,
              "verdi": "5060",
              "beskrivelse": "Nærøysund",
              "oid": 80006
            },
            {
              "id": 4890,
              "verdi": "5422",
              "beskrivelse": "Balsfjord",
              "oid": 80006
            },
            {
              "id": 4891,
              "verdi": "3803",
              "beskrivelse": "Tønsberg",
              "oid": 80006
            },
            {
              "id": 4892,
              "verdi": "5423",
              "beskrivelse": "Karlsøy",
              "oid": 80006
            },
            {
              "id": 4893,
              "verdi": "5424",
              "beskrivelse": "Lyngen",
              "oid": 80006
            },
            {
              "id": 4894,
              "verdi": "3804",
              "beskrivelse": "Sandefjord",
              "oid": 80006
            },
            {
              "id": 4895,
              "verdi": "5425",
              "beskrivelse": "Storfjord",
              "oid": 80006
            },
            {
              "id": 4896,
              "verdi": "5426",
              "beskrivelse": "Kåfjord",
              "oid": 80006
            },
            {
              "id": 4897,
              "verdi": "3805",
              "beskrivelse": "Larvik",
              "oid": 80006
            },
            {
              "id": 4898,
              "verdi": "4204",
              "beskrivelse": "Kristiansand",
              "oid": 80006
            },
            {
              "id": 4899,
              "verdi": "5427",
              "beskrivelse": "Skjervøy",
              "oid": 80006
            },
            {
              "id": 4900,
              "verdi": "4201",
              "beskrivelse": "Risør",
              "oid": 80006
            },
            {
              "id": 4901,
              "verdi": "3806",
              "beskrivelse": "Porsgrunn",
              "oid": 80006
            },
            {
              "id": 4902,
              "verdi": "5428",
              "beskrivelse": "Nordreisa",
              "oid": 80006
            },
            {
              "id": 4903,
              "verdi": "5429",
              "beskrivelse": "Kvænangen",
              "oid": 80006
            },
            {
              "id": 4904,
              "verdi": "5430",
              "beskrivelse": "Kautokeino",
              "oid": 80006
            },
            {
              "id": 4905,
              "verdi": "4202",
              "beskrivelse": "Grimstad",
              "oid": 80006
            },
            {
              "id": 4906,
              "verdi": "3807",
              "beskrivelse": "Skien",
              "oid": 80006
            },
            {
              "id": 4907,
              "verdi": "5432",
              "beskrivelse": "Loppa",
              "oid": 80006
            },
            {
              "id": 4908,
              "verdi": "4203",
              "beskrivelse": "Arendal",
              "oid": 80006
            },
            {
              "id": 4909,
              "verdi": "3808",
              "beskrivelse": "Notodden",
              "oid": 80006
            },
            {
              "id": 4910,
              "verdi": "5433",
              "beskrivelse": "Hasvik",
              "oid": 80006
            },
            {
              "id": 4911,
              "verdi": "5434",
              "beskrivelse": "Måsøy",
              "oid": 80006
            },
            {
              "id": 4912,
              "verdi": "3811",
              "beskrivelse": "Færder",
              "oid": 80006
            },
            {
              "id": 4913,
              "verdi": "5435",
              "beskrivelse": "Nordkapp",
              "oid": 80006
            },
            {
              "id": 4914,
              "verdi": "4206",
              "beskrivelse": "Farsund",
              "oid": 80006
            },
            {
              "id": 4915,
              "verdi": "3812",
              "beskrivelse": "Siljan",
              "oid": 80006
            },
            {
              "id": 4916,
              "verdi": "5436",
              "beskrivelse": "Porsanger",
              "oid": 80006
            },
            {
              "id": 4917,
              "verdi": "4207",
              "beskrivelse": "Flekkefjord",
              "oid": 80006
            },
            {
              "id": 4918,
              "verdi": "5437",
              "beskrivelse": "Karasjok",
              "oid": 80006
            },
            {
              "id": 4919,
              "verdi": "3813",
              "beskrivelse": "Bamble",
              "oid": 80006
            },
            {
              "id": 4920,
              "verdi": "4211",
              "beskrivelse": "Gjerstad",
              "oid": 80006
            },
            {
              "id": 4921,
              "verdi": "3814",
              "beskrivelse": "Kragerø",
              "oid": 80006
            },
            {
              "id": 4922,
              "verdi": "5438",
              "beskrivelse": "Lebesby",
              "oid": 80006
            },
            {
              "id": 4923,
              "verdi": "4212",
              "beskrivelse": "Vegårshei",
              "oid": 80006
            },
            {
              "id": 4924,
              "verdi": "5439",
              "beskrivelse": "Gamvik",
              "oid": 80006
            },
            {
              "id": 4925,
              "verdi": "3815",
              "beskrivelse": "Drangedal",
              "oid": 80006
            },
            {
              "id": 4926,
              "verdi": "5440",
              "beskrivelse": "Berlevåg",
              "oid": 80006
            },
            {
              "id": 4927,
              "verdi": "4213",
              "beskrivelse": "Tvedestrand",
              "oid": 80006
            },
            {
              "id": 4928,
              "verdi": "3816",
              "beskrivelse": "Nome",
              "oid": 80006
            },
            {
              "id": 4929,
              "verdi": "5441",
              "beskrivelse": "Tana",
              "oid": 80006
            },
            {
              "id": 4930,
              "verdi": "4214",
              "beskrivelse": "Froland",
              "oid": 80006
            },
            {
              "id": 4931,
              "verdi": "5442",
              "beskrivelse": "Nesseby",
              "oid": 80006
            },
            {
              "id": 4932,
              "verdi": "3818",
              "beskrivelse": "Tinn",
              "oid": 80006
            },
            {
              "id": 4933,
              "verdi": "5443",
              "beskrivelse": "Båtsfjord",
              "oid": 80006
            },
            {
              "id": 4934,
              "verdi": "4215",
              "beskrivelse": "Lillesand",
              "oid": 80006
            },
            {
              "id": 4935,
              "verdi": "5444",
              "beskrivelse": "Sør-Varanger",
              "oid": 80006
            },
            {
              "id": 4936,
              "verdi": "4216",
              "beskrivelse": "Birkenes",
              "oid": 80006
            },
            {
              "id": 4937,
              "verdi": "3819",
              "beskrivelse": "Hjartdal",
              "oid": 80006
            },
            {
              "id": 4938,
              "verdi": "4217",
              "beskrivelse": "Åmli",
              "oid": 80006
            },
            {
              "id": 4939,
              "verdi": "3820",
              "beskrivelse": "Seljord",
              "oid": 80006
            },
            {
              "id": 4940,
              "verdi": "4218",
              "beskrivelse": "Iveland",
              "oid": 80006
            },
            {
              "id": 4941,
              "verdi": "3821",
              "beskrivelse": "Kviteseid",
              "oid": 80006
            },
            {
              "id": 4942,
              "verdi": "3822",
              "beskrivelse": "Nissedal",
              "oid": 80006
            },
            {
              "id": 4943,
              "verdi": "4219",
              "beskrivelse": "Evje og Hornnes",
              "oid": 80006
            },
            {
              "id": 4944,
              "verdi": "3823",
              "beskrivelse": "Fyresdal",
              "oid": 80006
            },
            {
              "id": 4945,
              "verdi": "4220",
              "beskrivelse": "Bygland",
              "oid": 80006
            },
            {
              "id": 4946,
              "verdi": "3824",
              "beskrivelse": "Tokke",
              "oid": 80006
            },
            {
              "id": 4947,
              "verdi": "4221",
              "beskrivelse": "Valle",
              "oid": 80006
            },
            {
              "id": 4948,
              "verdi": "4222",
              "beskrivelse": "Bykle",
              "oid": 80006
            },
            {
              "id": 4949,
              "verdi": "3825",
              "beskrivelse": "Vinje",
              "oid": 80006
            },
            {
              "id": 4950,
              "verdi": "4223",
              "beskrivelse": "Vennesla",
              "oid": 80006
            },
            {
              "id": 4951,
              "verdi": "4224",
              "beskrivelse": "Åseral",
              "oid": 80006
            },
            {
              "id": 4952,
              "verdi": "4226",
              "beskrivelse": "Hægebostad",
              "oid": 80006
            },
            {
              "id": 4953,
              "verdi": "4227",
              "beskrivelse": "Kvinesdal",
              "oid": 80006
            },
            {
              "id": 4954,
              "verdi": "4228",
              "beskrivelse": "Sirdal",
              "oid": 80006
            }
          ];

        var verdensdeler = [{
                "id": 3735,
                "verdi": "1AF",
                "beskrivelse": "Afrika",
                "oid": 80022
            },
            {
                "id": 3736,
                "verdi": "1AQ",
                "beskrivelse": "Antarktis",
                "oid": 80022
            },
            {
                "id": 3737,
                "verdi": "1AS",
                "beskrivelse": "Asia",
                "oid": 80022
            },
            {
                "id": 3738,
                "verdi": "1EU",
                "beskrivelse": "Europa",
                "oid": 80022
            },
            {
                "id": 3739,
                "verdi": "1NA",
                "beskrivelse": "Nord-Amerika",
                "oid": 80022
            },
            {
                "id": 3740,
                "verdi": "1OS",
                "beskrivelse": "Oseania",
                "oid": 80022
            },
            {
                "id": 3741,
                "verdi": "1SA",
                "beskrivelse": "Sør- og Mellom-Amerika",
                "oid": 80022
            }];

        var yrkeKategori = [
          {
            "id": 3767,
            "verdi": "98",
            "beskrivelse": "Annet",
            "oid": 80010
          },
          {
            "id": 3768,
            "verdi": "06",
            "beskrivelse": "Au pair",
            "oid": 80010
          },
          {
            "id": 3769,
            "verdi": "04",
            "beskrivelse": "Barnehagebarn",
            "oid": 80010
          },
          {
            "id": 3770,
            "verdi": "10",
            "beskrivelse": "Barnehagepersonell",
            "oid": 80010
          },
          {
            "id": 3771,
            "verdi": "01",
            "beskrivelse": "Helsepersonell",
            "oid": 80010
          },
          {
            "id": 3772,
            "verdi": "11",
            "beskrivelse": "Jobber med husdyr",
            "oid": 80010
          },
          {
            "id": 3773,
            "verdi": "02",
            "beskrivelse": "Matpersonell",
            "oid": 80010
          },
          {
            "id": 3774,
            "verdi": "05",
            "beskrivelse": "Student/Elev",
            "oid": 80010
          },
          {
            "id": 3775,
            "verdi": "99",
            "beskrivelse": "Ukjent",
            "oid": 80010
          },
          {
            "id": 3776,
            "verdi": "03",
            "beskrivelse": "Undervisningspersonell",
            "oid": 80010
          },
          {
            "id": 5035,
            "verdi": "12",
            "beskrivelse": "Persontransport",
            "oid": 80010
          }
        ];

        var arbeidsplassKategori = [
            {
              "id": 3777,
              "verdi": "98",
              "beskrivelse": "Annet",
              "oid": 80025
            },
            {
              "id": 3778,
              "verdi": "01",
              "beskrivelse": "Barnehage",
              "oid": 80025
            },
            {
              "id": 3779,
              "verdi": "02",
              "beskrivelse": "Grunnskole/Videregående",
              "oid": 80025
            },
            {
              "id": 3780,
              "verdi": "03",
              "beskrivelse": "Høyskole/Universitet",
              "oid": 80025
            },
            {
              "id": 3781,
              "verdi": "20",
              "beskrivelse": "Sykehjem",
              "oid": 80025
            },
            {
              "id": 3782,
              "verdi": "21",
              "beskrivelse": "Sykehus",
              "oid": 80025
            },
            {
              "id": 5036,
              "verdi": "10",
              "beskrivelse": "Kollektivnæring",
              "oid": 80025
            },
            {
              "id": 5083,
              "verdi": "22",
              "beskrivelse": "Hjemmesykepleie",
              "oid": 80025
            },
            {
              "id": 5084,
              "verdi": "90",
              "beskrivelse": "Ikke yrkesaktiv",
              "oid": 80025
            },
            {
              "id": 5085,
              "verdi": "30",
              "beskrivelse": "Serveringssted",
              "oid": 80025
            },
            {
              "id": 5087,
              "verdi": "23",
              "beskrivelse": "Helseinstitusjon, annet",
              "oid": 80025
            }
          ];          

        var arsakerTilUtenlandsopphold = [{"id":3884,"verdi":"8","beskrivelse":"Annet","oid":80019},{"id":3885,"verdi":"4","beskrivelse":"Arbeids-/studie-/langtidsopphold","oid":80019},{"id":3886,"verdi":"3","beskrivelse":"Forretningsreise","oid":80019},{"id":3887,"verdi":"5","beskrivelse":"Hjembesøk","oid":80019},{"id":3888,"verdi":"1","beskrivelse":"Smittet før innvandring","oid":80019},{"id":3889,"verdi":"2","beskrivelse":"Turisme","oid":80019},{"id":3890,"verdi":"9","beskrivelse":"Ukjent","oid":80019}];

        var jaNeiUkjent = [{"id":11,"verdi":"1","beskrivelse":"Ja","oid":80017},{"id":12,"verdi":"2","beskrivelse":"Nei","oid":80017},{"id":13,"verdi":"3","beskrivelse":"Ukjent","oid":80017}];

        var eksponeringssteder = [
          {
              "id": 5025,
              "verdi": "97",
              "beskrivelse": "Annet",
              "oid": 80100
          },
          {
              "id": 5026,
              "verdi": "01",
              "beskrivelse": "Husstand",
              "oid": 80100
          },
          {
              "id": 5027,
              "verdi": "02",
              "beskrivelse": "Helseinstitusjon - pasient",
              "oid": 80100
          },
          {
              "id": 5029,
              "verdi": "04",
              "beskrivelse": "Barnehage/skole - barn/elev",
              "oid": 80100
          },
          {
              "id": 5030,
              "verdi": "05",
              "beskrivelse": "Serveringssted/bar/utested - gjest",
              "oid": 80100
          },
          {
              "id": 5031,
              "verdi": "06",
              "beskrivelse": "Arrangement offentlig",
              "oid": 80100
          },
          {
              "id": 5032,
              "verdi": "07",
              "beskrivelse": "Organisert fritidsaktivitet",
              "oid": 80100
          },
          {
              "id": 5034,
              "verdi": "99",
              "beskrivelse": "Ukjent",
              "oid": 80100
          },
          {
              "id": 5091,
              "verdi": "12",
              "beskrivelse": "Privat arrangement på offentlig sted",
              "oid": 80100
          },
          {
              "id": 5092,
              "verdi": "13",
              "beskrivelse": "Samling i privat hjem",
              "oid": 80100
          },
          {
              "id": 5093,
              "verdi": "14",
              "beskrivelse": "Universitet/høyskole - student",
              "oid": 80100
          },
          {
              "id": 5094,
              "verdi": "15",
              "beskrivelse": "Jobb - i arbeidstid",
              "oid": 80100
          },
          {
              "id": 5095,
              "verdi": "16",
              "beskrivelse": "Reise",
              "oid": 80100
          }
        ];

        var sykehusListe = [
            {
                "id": 1,
                "navn": "Akershus Universitetssykehus"
            },
            {
                "id": 3,
                "navn": "Aker"
            },
            {
                "id": 4,
                "navn": "Andre"
            },
            {
                "id": 6,
                "navn": "Arendal"
            },
            {
                "id": 7,
                "navn": "Askim SH"
            },
            {
                "id": 8,
                "navn": "Blakstad psyk SH"
            },
            {
                "id": 10,
                "navn": "Bodø"
            },
            {
                "id": 12,
                "navn": "Bærum sykehus"
            },
            {
                "id": 13,
                "navn": "Drammen sykehus"
            },
            {
                "id": 14,
                "navn": "Diakonhjemmet sykehus"
            },
            {
                "id": 16,
                "navn": "Elverum"
            },
            {
                "id": 17,
                "navn": "Flekkefjord"
            },
            {
                "id": 18,
                "navn": "Florø SH"
            },
            {
                "id": 19,
                "navn": "Fredrikstad SH"
            },
            {
                "id": 21,
                "navn": "Førde sentralsjukehus"
            },
            {
                "id": 22,
                "navn": "Gjøvik"
            },
            {
                "id": 23,
                "navn": "Hamar"
            },
            {
                "id": 24,
                "navn": "Gaustad psyk SH"
            },
            {
                "id": 25,
                "navn": "Glitreklinikken"
            },
            {
                "id": 26,
                "navn": "Halden SH"
            },
            {
                "id": 27,
                "navn": "Hallingdal Sjukestugu, Vestre Viken"
            },
            {
                "id": 29,
                "navn": "Hammerfest sykehus"
            },
            {
                "id": 30,
                "navn": "Haraldsplass diakonale sykehus"
            },
            {
                "id": 32,
                "navn": "Harstad sykehus"
            },
            {
                "id": 34,
                "navn": "Haugesund sykehus"
            },
            {
                "id": 36,
                "navn": "Haukeland universitetssykehus"
            },
            {
                "id": 37,
                "navn": "Kirkenes sykehus"
            },
            {
                "id": 38,
                "navn": "Kongsberg sykehus"
            },
            {
                "id": 39,
                "navn": "Kongsvinger"
            },
            {
                "id": 40,
                "navn": "Horten SH"
            },
            {
                "id": 42,
                "navn": "Kragerø"
            },
            {
                "id": 43,
                "navn": "Kristiansand"
            },
            {
                "id": 45,
                "navn": "Kristiansund"
            },
            {
                "id": 47,
                "navn": "Larvik"
            },
            {
                "id": 49,
                "navn": "Sykehuset Levanger"
            },
            {
                "id": 50,
                "navn": "Lillehammer"
            },
            {
                "id": 51,
                "navn": "Lofoten"
            },
            {
                "id": 52,
                "navn": "Lærdal sykehus"
            },
            {
                "id": 53,
                "navn": "Molde"
            },
            {
                "id": 54,
                "navn": "Longyearbyen SH"
            },
            {
                "id": 55,
                "navn": "Lovisenberg Diakonale sykehus"
            },
            {
                "id": 56,
                "navn": "Mandal SH"
            },
            {
                "id": 58,
                "navn": "Mosjøen"
            },
            {
                "id": 59,
                "navn": "Sykehuset Namsos"
            },
            {
                "id": 60,
                "navn": "Narvik"
            },
            {
                "id": 61,
                "navn": "Nordfjord sykehus"
            },
            {
                "id": 62,
                "navn": "Notodden"
            },
            {
                "id": 63,
                "navn": "Odda sjukehus"
            },
            {
                "id": 64,
                "navn": "Sykehuset Østfold, Moss"
            },
            {
                "id": 65,
                "navn": "Oslo Helseråd"
            },
            {
                "id": 67,
                "navn": "Orkdal sykehus"
            },
            {
                "id": 68,
                "navn": "Radiumhospitalet"
            },
            {
                "id": 69,
                "navn": "Mo i Rana"
            },
            {
                "id": 70,
                "navn": "Rikshospitalet"
            },
            {
                "id": 71,
                "navn": "Ringerike sykehus"
            },
            {
                "id": 72,
                "navn": "Rjukan"
            },
            {
                "id": 73,
                "navn": "Sandefjord"
            },
            {
                "id": 74,
                "navn": "Sandnessjøen"
            },
            {
                "id": 75,
                "navn": "Skien"
            },
            {
                "id": 76,
                "navn": "St Olavs hospital"
            },
            {
                "id": 77,
                "navn": "Reinsvoll SH"
            },
            {
                "id": 78,
                "navn": "Røros SH"
            },
            {
                "id": 79,
                "navn": "Sanderud psyk SH"
            },
            {
                "id": 80,
                "navn": "Sarpsborg SH"
            },
            {
                "id": 81,
                "navn": "Ski SH"
            },
            {
                "id": 83,
                "navn": "Stavanger Universitetssykehus"
            },
            {
                "id": 84,
                "navn": "Stord sykehus"
            },
            {
                "id": 85,
                "navn": "Tromsø"
            },
            {
                "id": 86,
                "navn": "Tynset"
            },
            {
                "id": 87,
                "navn": "Tønsberg"
            },
            {
                "id": 88,
                "navn": "Ullevål"
            },
            {
                "id": 89,
                "navn": "Vesterålen"
            },
            {
                "id": 90,
                "navn": "Volda"
            },
            {
                "id": 91,
                "navn": "Voss sykehus"
            },
            {
                "id": 92,
                "navn": "Ålesund"
            },
            {
                "id": 93,
                "navn": "Stensby SH"
            },
            {
                "id": 94,
                "navn": "Sunnaas SH"
            },
            {
                "id": 95,
                "navn": "Trønd psyk SH"
            },
            {
                "id": 96,
                "navn": "Sykehuset Østfold, Kalnes"
            },
            {
                "id": 97,
                "navn": "Åsgard psyk SH"
            },
            {
                "id": 151,
                "navn": "Martina Hansens Hospital"
            },
            {
                "id": 152,
                "navn": "Betanien Hospital"
            },
            {
                "id": 154,
                "navn": "Haugesund Sanitetsforenings revmatismesykehus AS"
            },
            {
                "id": 158,
                "navn": "Revmatismesykehuset AS"
            }
          ];
        var underliggendeSykdommer = [
            {
              "id": 5007,
              "verdi": "97",
              "beskrivelse": "Annet",
              "oid": 80099
            },
            {
              "id": 5008,
              "verdi": "01",
              "beskrivelse": "Kreft",
              "oid": 80099
            },
            {
              "id": 5009,
              "verdi": "02",
              "beskrivelse": "Kols",
              "oid": 80099
            },
            {
              "id": 5010,
              "verdi": "03",
              "beskrivelse": "Nedsatt immunforsvar",
              "oid": 80099
            },
            {
              "id": 5011,
              "verdi": "04",
              "beskrivelse": "Diabetes",
              "oid": 80099
            },
            {
              "id": 5012,
              "verdi": "05",
              "beskrivelse": "Hjertesykdom",
              "oid": 80099
            },
            {
              "id": 5013,
              "verdi": "06",
              "beskrivelse": "Fedme (KMI>30)",
              "oid": 80099
            },
            {
              "id": 5014,
              "verdi": "07",
              "beskrivelse": "Astma",
              "oid": 80099
            },
            {
              "id": 5015,
              "verdi": "08",
              "beskrivelse": "Kronisk lungesykdom",
              "oid": 80099
            },
            {
              "id": 5016,
              "verdi": "09",
              "beskrivelse": "Nyresykdom",
              "oid": 80099
            },
            {
              "id": 5017,
              "verdi": "10",
              "beskrivelse": "Leversykdom",
              "oid": 80099
            },
            {
              "id": 5018,
              "verdi": "11",
              "beskrivelse": "Nevrologisk/nevromuskulær",
              "oid": 80099
            },
            {
              "id": 5019,
              "verdi": "12",
              "beskrivelse": "Graviditet",
              "oid": 80099
            },
            {
              "id": 5020,
              "verdi": "13",
              "beskrivelse": "Røyker",
              "oid": 80099
            },
            {
              "id": 5022,
              "verdi": "15",
              "beskrivelse": "Forhøyet blodtrykk",
              "oid": 80099
            },
            {
              "id": 5023,
              "verdi": "98",
              "beskrivelse": "Ingen underliggende sykdom",
              "oid": 80099
            },
            {
              "id": 5024,
              "verdi": "99",
              "beskrivelse": "Ukjent",
              "oid": 80099
            }
          ];

        var indikasjoner = [
          {
            "id": 3798,
            "verdi": "80",
            "beskrivelse": "Annen indikasjon",
            "oid": 80014
          },
          {
            "id": 3799,
            "verdi": "45",
            "beskrivelse": "Arbeid med pasienter eller barn",
            "oid": 80014
          },
          {
            "id": 3800,
            "verdi": "11",
            "beskrivelse": "Immunsvekkende tilstand/behandling",
            "oid": 80014
          },
          {
            "id": 3801,
            "verdi": "50",
            "beskrivelse": "Obduksjon",
            "oid": 80014
          },
          {
            "id": 3802,
            "verdi": "30",
            "beskrivelse": "Pasientens ønske",
            "oid": 80014
          },
          {
            "id": 3803,
            "verdi": "70",
            "beskrivelse": "PrEP-kontroll",
            "oid": 80014
          },
          {
            "id": 3804,
            "verdi": "42",
            "beskrivelse": "Rutineundersøkelse av blodgiver",
            "oid": 80014
          },
          {
            "id": 3805,
            "verdi": "43",
            "beskrivelse": "Rutineundersøkelse av bløder",
            "oid": 80014
          },
          {
            "id": 3806,
            "verdi": "40",
            "beskrivelse": "Rutineundersøkelse av gravid",
            "oid": 80014
          },
          {
            "id": 3807,
            "verdi": "41",
            "beskrivelse": "Rutineundersøkelse av innvandrer",
            "oid": 80014
          },
          {
            "id": 3808,
            "verdi": "49",
            "beskrivelse": "Rutineundersøkelse ikke nærmere angitt",
            "oid": 80014
          },
          {
            "id": 3809,
            "verdi": "46",
            "beskrivelse": "Rutineus, kontakt med helsevesenet i utlandet",
            "oid": 80014
          },
          {
            "id": 3810,
            "verdi": "44",
            "beskrivelse": "Rutineus.i forbindelse m/sykehusopphold",
            "oid": 80014
          },
          {
            "id": 3811,
            "verdi": "20",
            "beskrivelse": "Smitteoppsporing (miljøundersøkelse)",
            "oid": 80014
          },
          {
            "id": 3812,
            "verdi": "10",
            "beskrivelse": "Symptomer eller tegn",
            "oid": 80014
          },
          {
            "id": 3813,
            "verdi": "60",
            "beskrivelse": "Tilfeldig funn",
            "oid": 80014
          },
          {
            "id": 3814,
            "verdi": "99",
            "beskrivelse": "Ukjent",
            "oid": 80014
          },
          {
            "id": 5074,
            "verdi": "47",
            "beskrivelse": "Grenseovergang",
            "oid": 80014
          },
          {
            "id": 5082,
            "verdi": "81",
            "beskrivelse": "Utenlandsk arbeidstaker",
            "oid": 80014
          },
          {
            "id": 5100,
            "verdi": "21",
            "beskrivelse": "Test etter varsel fra Smittestopp-app",
            "oid": 80014
          }
        ]

        var codeLookup = function(codes,field,value) {
            var codeFound = null;
            codes.forEach(function (code){
                if(code[field] && value && (code[field].toLowerCase() == value.toLowerCase())) {
                    codeFound = code;
                }
            });
            return codeFound;
        }

        var getKjonn = function(kjonn) {
            var codes = [{"id": 1,"verdi": "1","beskrivelse": "Mann","oid": 3101}, {"id": 2,"verdi": "2","beskrivelse": "Kvinne","oid": 3101}, {"id": 3,"verdi": "9","beskrivelse": "Ikke kjent","oid": 3101}];
            return codeLookup(codes,"beskrivelse",kjonn);
        }

        var getBosted = function(kommuneNr) {
            return codeLookup(kommunerOgBydeler,"verdi",kommuneNr);
        }

        var getLand = function(landnavn) {
            if(landnavn == 'Karibisk Nederland') {
                landnavn = 'Nederlandske Antiller';
            }

            return codeLookup(land,"beskrivelse",landnavn);
        }

        var getYrke = function(yrke) {
            var map = {};
            map['Ikke yrkesaktiv']='Annet';
            map['Butikkansatt']='Annet';
            map['Frisør og lignende']='Annet';
            map['Laboratoriearbeider']='Annet';
            map['Student']='Student/Elev';
            map['Drosjesjåfør']='Persontransport';
            map['Bussjåfør']='Persontransport';
            map['Pensjonist']='Annet';
            map['Elev']='Student/Elev';

            return codeLookup(yrkeKategori,"beskrivelse",map[yrke] ? map[yrke] : yrke);
      }

        var getSmittested = function(bakgrunn, kommuneNr) {
            var verdi = trim(bakgrunn.QPBQ6ha3KSU)
            if(verdi == 'Ukjent') {
                return {"id":3745,"verdi":"1UK","beskrivelse":"Ukjent","oid":80022};
            } else if (verdi == 'Verdensdel') {
                return codeLookup(verdensdeler, 'beskrivelse', bakgrunn.r9wly8yChCe );
            } else if (verdi == 'Land') {
                return getLand(bakgrunn.G2EbXQPYKUM);
            } else if (verdi == 'Kommune') {
                return codeLookup(kommunerOgBydeler, 'beskrivelse', bakgrunn.hYwdup3TdCH );
            } else if (verdi == 'Bydel') {
                return codeLookup(kommunerOgBydeler, 'beskrivelse', bakgrunn.xX6HSBa83pB );
            } else if (verdi == 'Registrerende kommune') {
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
          if( value == 'Sykehjem' || value == 'Legekontor' || value == 'Sykehus') {
              value = 'Helseinstitusjon - pasient';
          }
          if( value == 'Barnehage' || value == 'Skole') {
              value = 'Barnehage/skole - barn/elev'
          }

          return codeLookup(eksponeringssteder,"beskrivelse",value)
        }

        var getInnlagtSykehus = function(helseStatus) {
            if(helseStatus.bOYWVEBaWy6 == 'Innlagt på sykehus - fortsatt i isolasjon') {
                return getJaNeiUkjent("Ja");
            } else if(helseStatus.bOYWVEBaWy6 == "Ukjent") {
                return getJaNeiUkjent("Ukjent");
            } else if(helseStatus.bOYWVEBaWy6 != "Ukjent") {
                return getJaNeiUkjent("Nei");
            }
        }

        var getInnlagtSykehjem = function(helseStatus) {
            if(helseStatus.bOYWVEBaWy6 == 'Innlagt på sykehjem - fortsatt i isolasjon') {
                return getJaNeiUkjent("Ja");
            } else if(helseStatus.bOYWVEBaWy6 == "Ukjent") {
                return getJaNeiUkjent("Ukjent");
            } else if(helseStatus.bOYWVEBaWy6 != "Ukjent") {
                return getJaNeiUkjent("Nei");
            }
        }

        var getSykehus = function(sykehus) {
            return codeLookup(sykehusListe,"navn",sykehus);
        }

        var getIndikasjon = function(indikasjon){
            return codeLookup(indikasjoner,'beskrivelse',indikasjon);
        }

        var getSykdomsBilde = function(helseutfall) {
            if(helseutfall.bOYWVEBaWy6 == 'Asymptomatisk - fortsatt i isolasjon') {
                return {"id":3819,"verdi":"00","beskrivelse":"Asymptomatisk","oid":80015};
            } else if(helseutfall.bOYWVEBaWy6 == 'Innlagt på sykehus - fortsatt i isolasjon' ||
                        helseutfall.bOYWVEBaWy6 == 'Innlagt på sykehjem - fortsatt i isolasjon' ||
                        helseutfall.bOYWVEBaWy6 == 'Har Covid-19 symptomer - fortsatt i isolasjon') {
                return {"id":3851,"verdi":"21","beskrivelse":"Øvre LVI","oid":80015};
            } else if (helseutfall.bOYWVEBaWy6 == 'Annet'){
                return {"id":3817,"verdi":"90","beskrivelse":"Annet","oid":80015};
            } else if (helseutfall.bOYWVEBaWy6 == 'Ukjent'){
                return {"id":3848,"verdi":"99","beskrivelse":"Ukjent","oid":80015};
            } else {
                return null;
            }
        }

        var getUnderliggendeSykdomListe = function(bakgrunn) {
            var sykdommer = [];

            if(bakgrunn.VwIcGOFyi3Q){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Astma'))};
            if(bakgrunn.coUb4QcuVKI){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Diabetes'))};
            if(bakgrunn.geeY6wHrzA0){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Fedme (KMI>30)'))};
            if(bakgrunn.AaBuania9Ot){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Forhøyet blodtrykk'))};
            if(bakgrunn.K7uUiBkrkYB){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Hjertesykdom'))};
            if(bakgrunn.VIa8JayRQbA){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Kols'))};
            if(bakgrunn.QQlLI413Wn1){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Kreft'))};
            if(bakgrunn.j6LrBVzW3k4){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Leversykdom'))};
            if(bakgrunn.vWzPVyomNL8){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Nedsatt immunforsvar'))};
            if(bakgrunn.hcHUkwpjcDc){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Nevrologisk/nevromuskulær'))};
            if(bakgrunn.rMRNPKj8FBS){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Nyresykdom'))};
            if(bakgrunn.rtxSNjWcnxC){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Røyker'))};
            if(bakgrunn.NrUvDud9C5g){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Kronisk lungesykdom'))};
            if(bakgrunn.Bt9xOiBUuDW){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Graviditet'))};
            if(bakgrunn.Blwor7jyBB9){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Annet'))};
            if(bakgrunn.RUHPJ5GVvjb){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Ukjent'))};
            if(!bakgrunn.zzlA5JFfLCR){sykdommer.push(codeLookup(underliggendeSykdommer,'beskrivelse','Ingen underliggende sykdom'))};

            return sykdommer;
        }

        var getArbeidsplassKategori = function(kategori) {
            return codeLookup(arbeidsplassKategori, "beskrivelse", kategori);
        }

        var constructNotificationMessage = function(tei,events,kommuneNr,getTextMessage) {

            var textMessages = [];

            var bakgrunnsUndersokelse = {};
            var helseStatus = {};
            var helseStatusFound = false;
            var sistePositiveTest = {};
            var symptomStart = '';
            events.forEach(function(event) {
                if (event.programStage == 'LpWNjNGvCO5') {
                    bakgrunnsUndersokelse = event;
                } else if (event.programStage == 'oqsk2Jv4k3s') {
                    if( event.s3eoonJ8OJb ) {
                        symptomStart = event.s3eoonJ8OJb;
                    }
                    if(!helseStatusFound) {
                        helseStatus = event;
                        helseStatusFound = true;
                    }
                } else if (event.programStage == 'dDHkBd3X8Ce' && event.ovY6E8BSdto == 'Positiv') {
                    sistePositiveTest = event;
                }
            });

            //------PASIENT

            var pasient = {};

            if(tei.ZSt07qyq6Pt) {
                textMessages.push("Fødselsnummer: " + tei.ZSt07qyq6Pt);
                pasient.fodselsnummer = tei.ZSt07qyq6Pt;
            }

            if(tei.NI0QRzJvQ0k) {
                textMessages.push("Fødselsdato: " + tei.NI0QRzJvQ0k);
                pasient.fodselsdato = DateUtils.formatFromUserToApi(tei.NI0QRzJvQ0k);
            }

            if(tei.sB1IHYu2xQT) {
                textMessages.push("Fornavn: " + tei.sB1IHYu2xQT);
                pasient.fornavn = tei.sB1IHYu2xQT;
            }

            if(tei.ENRjVGxVL6l) {
                textMessages.push("Etternavn: " + tei.ENRjVGxVL6l);
                pasient.etternavn = tei.ENRjVGxVL6l;
            }

            var bosted = getBosted(kommuneNr);
            if(bosted) {
                textMessages.push("Bosted: " + bosted.beskrivelse);
                pasient.bosted = bosted;
            }

            if(tei.ooK7aSiAaGq) {
                textMessages.push("Arbeidsplass: " + tei.ooK7aSiAaGq);
                pasient.arbeidsplass = tei.ooK7aSiAaGq;
            }

            if(tei.tOq71gWwiYQ) {
              textMessages.push("Arbeidsplasskategori: " + tei.tOq71gWwiYQ);
              pasient.arbeidsplasskategori = getArbeidsplassKategori(tei.tOq71gWwiYQ);
            }

            var kjonn = getKjonn(tei.oindugucx72);
            if(kjonn) {
                textMessages.push("Kjønn: " + kjonn.beskrivelse);
                pasient.kjonn = kjonn;
            }

            var fodeland = getLand(tei.hBcoBCZBWFb);
            if(fodeland) {
                textMessages.push("Fodeland: " + tei.hBcoBCZBWFb);
                pasient.fodeland = fodeland;
            }

            var yrkesgruppe = getYrke(tei.l5y5P4d1vbM);
            if(yrkesgruppe) {
                textMessages.push("Yrkesgruppe: " + yrkesgruppe.beskrivelse);
                pasient.yrkesgruppe = yrkesgruppe;
            }

            //------SMITTEFORHOLD

            var smitteforhold = {};

            if(bakgrunnsUndersokelse.VyaD2KGfpUA) {
                textMessages.push("Annet smittested: " + bakgrunnsUndersokelse.VyaD2KGfpUA);
                smitteforhold.annetSmittested = bakgrunnsUndersokelse.VyaD2KGfpUA;
            }

            if(bakgrunnsUndersokelse.brUNizYRJ6i) {
                textMessages.push("Dato for hjemkomst: " + bakgrunnsUndersokelse.brUNizYRJ6i);
                smitteforhold.datoForHjemkomst = DateUtils.formatFromUserToApi(bakgrunnsUndersokelse.brUNizYRJ6i);
            }

            var smittested = getSmittested(bakgrunnsUndersokelse, kommuneNr);
            if(smittested) {
                textMessages.push("Smittested: " + smittested.beskrivelse);
                smitteforhold.smittested = smittested;
            }

            var arsakTilUtenlandsopphold = getArsakTilUtenlandsopphold(bakgrunnsUndersokelse.LwjOWAWb4Jm);
            if(arsakTilUtenlandsopphold) {
                textMessages.push("Årsak til utenlandsopphold: " + arsakTilUtenlandsopphold.beskrivelse);
                smitteforhold.arsakTilUtenlandsopphold = arsakTilUtenlandsopphold
            }

            var harBekreftetNarkontakt = getJaNeiUkjent(bakgrunnsUndersokelse.WkjX7MGyi8z);
            if(harBekreftetNarkontakt) {
                textMessages.push("Har bekreftet nærkontakt: " + harBekreftetNarkontakt.beskrivelse);
                smitteforhold.harBekreftetNarkontakt = harBekreftetNarkontakt;
            }

            var eksponeringssted = getEksponeringssted(bakgrunnsUndersokelse.XA2Pk3U89ty);
            if(eksponeringssted) {
                textMessages.push("Eksponeringssted: " + eksponeringssted.beskrivelse);
                smitteforhold.eksponeringssted = eksponeringssted;
            }

            //-------DIAGNOSEFORHOLD
            var diagnoseforhold = {
                //hardkodes ved Covid19
                diagnose: {"id":4734,"verdi":"713","beskrivelse":"Koronavirus med utbruddspotensial","oid":80012},
                smittestoff: {"id":4735,"verdi":"713000","beskrivelse":"SARS-COV-2","oid":80000}
                //annenIndikasjon: string,  <-- DENNE FINNES IKKE I FIKS
                //annenKlinikk: string,    <-- DENNE ER IKKE DISKUTERT, FINNES IKKE I FIKS OG SER DEN IKKE I MSIS WEB
                //utfallAvSykdommen: {      <-- DENNE ER IKKE DISKUTERT, FINNES IKKE I FIKS OG SER DEN IKKE I MSIS WEB
                //  id: 0,
                //  verdi: string,
                //  beskrivelse: string,
                //  oid: 0
                //},
                //folgetilstander: string,     <-- DENNE ER IKKE DISKUTERT, FINNES IKKE I FIKS OG SER DEN IKKE I MSIS WEB
            };

            textMessages.push("Diagnose: Koronavirus med utbruddspotensial");
            textMessages.push("Smittestoff: SARS-COV-2");

            var antattSmittetDato = bakgrunnsUndersokelse.LS20ZSe0zAC;
            {
                textMessages.push("Antatt smittet dato: " + antattSmittetDato);
                diagnoseforhold.antattSmittetDato = DateUtils.formatFromUserToApi(antattSmittetDato);
            }

            if(helseStatus.SFaxZRvgnsg) {
                textMessages.push("Sykehjemsnavn: " + helseStatus.SFaxZRvgnsg);
                diagnoseforhold.sykehjemNavn = helseStatus.SFaxZRvgnsg;
            }

            if(symptomStart != '') {
                textMessages.push("Innsykningsdato: " + symptomStart);
                diagnoseforhold.innsykningsdato = DateUtils.formatFromUserToApi(symptomStart);
            }

            if(sistePositiveTest.ylnZBwlN80w) {
                textMessages.push("Prøvedato: " + sistePositiveTest.ylnZBwlN80w);
                diagnoseforhold.provedato = DateUtils.formatFromUserToApi(sistePositiveTest.ylnZBwlN80w);
            }

            if(helseStatus.dDEdmn8q3P1) {
                textMessages.push("Dødsdato: " + helseStatus.dDEdmn8q3P1);
                diagnoseforhold.dodsdato = DateUtils.formatFromUserToApi(helseStatus.dDEdmn8q3P1);
            }

            var erInnlagtPaaSykehjem = getInnlagtSykehjem(helseStatus);
            if(erInnlagtPaaSykehjem) {
                textMessages.push("Er innlagt på sykehjem: " + erInnlagtPaaSykehjem.beskrivelse);
                diagnoseforhold.erInnlagtPaaSykehjem = erInnlagtPaaSykehjem;
            }

            var erInnlagtPaaSykehus = getInnlagtSykehus(helseStatus);
            if(erInnlagtPaaSykehus) {
                textMessages.push("Er innlagt på sykehys: " + erInnlagtPaaSykehus.beskrivelse);
                diagnoseforhold.erInnlagtPaaSykehus = erInnlagtPaaSykehus;
            }

            var sykehus = getSykehus(helseStatus.yBUxbX079to);
            if(sykehus) {
                textMessages.push("Sykehus: " + sykehus.navn);
                diagnoseforhold.sykehus = sykehus;
            }

            var indikasjon = getIndikasjon(bakgrunnsUndersokelse.vrrQP9OrjOB);
            if(indikasjon) {
                textMessages.push("Indikasjon: " + indikasjon.beskrivelse);
                diagnoseforhold.indikasjon = indikasjon;
            }

            var sykdomsbilde = getSykdomsBilde(helseStatus);
            if(sykdomsbilde) {
                textMessages.push("Sykdomsbilde: " + sykdomsbilde.beskrivelse);
                diagnoseforhold.sykdomsbilde = sykdomsbilde;
            }

            var underliggendeSykdom = getUnderliggendeSykdomListe(bakgrunnsUndersokelse);
            if( underliggendeSykdom && underliggendeSykdom.length > 0 ) {
                underliggendeSykdom.forEach(function(sykdom){
                    textMessages.push("Underliggende sykdom: " + sykdom.beskrivelse);
                });
                diagnoseforhold.underliggendeSykdom = underliggendeSykdom;
            }
            

            //-------MELDING

            var melding = {
                pasient: pasient,
                diagnoseforhold: diagnoseforhold,
                antattSmittemate: {
                    //smittemåte hardkodes for Covid
                    smittemate: {"id":3873,"verdi":"70","beskrivelse":"Luft/Dråpesmitte","oid":80018},
                    //smittesituasjon: string    <- MAPPING IKKE DISKUTERT
                },
                smitteforhold: smitteforhold,
                rekvirent: {}
            }

            textMessages.push("Smittemåte: Luft/Dråpesmitte");

            if(getTextMessage) {
                return textMessages;
            } else {
                return melding;
            }
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
            lookupVaccine: function(fNr, kommuneNr, userId) {
                var url = '../' + DHIS2URL + '/vaksine/sok';
                var promise = $http({
                    method: 'POST',
                    url: url,
                    data: {fnr:fNr, kommunenr:kommuneNr, userid:userId},
                    headers: {'Content-Type': 'application/json', 'ingress-csrf': $cookies['ingress-csrf']},
                }).then(function(response){
                    return response.data;
                },function(error) {
                    var errorMsgHdr, errorMsgBody;
                    errorMsgHdr = $translate.instant('error');

                    errorMsgBody =  'Feil ved henting av vaksinedata:' + fNr;

                    if(error.status == 403) {
                        errorMsgBody = `Tjenesten Fiks vaksine er ikke tilgjengelig for deg.
                        Det kan være to årsaker til dette
                        <ol>
                        <li>Din kommune har ikke aktivert tjenesten Fiks vaksine. Les mer om aktivering av Fiks vaksine her: <a target="_blank" href="https://portal.fiks.ks.no/fiks/fiks-vaksine/">https://portal.fiks.ks.no/fiks/fiks-vaksine/</a></li>
                        <li>Tjenesten er aktivert, men du har ikke fått rettigheter til å gjøre oppslag. Ta kontakt med Fiks administrator i din kommune.</li>
                        </ol>`;
                    }
                    else if(error.status == 401) {
                        errorMsgBody = "Kunne ikke nå tjeneste for vaksinedata, prøv å logge inn på nytt.";
                    }

                    NotificationService.showNotifcationDialog(errorMsgHdr, errorMsgBody);
                    return null;
                });
                return promise;
            },
            getNotificationMessageTextSummary: function(kommuneNr, tei, allEvents) {
                return constructNotificationMessage(tei, allEvents, kommuneNr, true);
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
                    if(response.data.status == 'ok'){
                        NotificationService.showNotifcationDialog("Klinikermelding sendt", "Klinikermelding er sendt inn i MSIS.");
                    }
                    return response.data;
                },function(error){
                    var errorMsgHdr, errorMsgBody;
                    errorMsgHdr = $translate.instant('error');

                    errorMsgBody =  'Feil ved innsending av klinikermelding til MSIS';

                    if(error.status == 403) {
                        errorMsgBody = `Tjenesten Fiks klinikermelding er ikke tilgjengelig for deg.
                        Det kan være to årsaker til dette
                        <ol>
                        <li>Din kommune har ikke aktivert tjenesten Fiks klinikermelding. Les mer om aktivering av Fiks klinikermelding her: <a target="_blank" href="https://portal.fiks.ks.no/fiks/fiks-klinikermelding/">https://portal.fiks.ks.no/fiks/fiks-klinikermelding</a></li>
                        <li>Tjenesten er aktivert, men du har ikke fått rettigheter til å gjøre oppslag. Ta kontakt med Fiks administrator i din kommune.</li>
                        </ol>`;
                    }
                    else if(error.status == 401) {
                        errorMsgBody = "Kunne ikke nå tjeneste for klinikermelding, prøv å logge inn på nytt.";
                    }

                    NotificationService.showNotifcationDialog(errorMsgHdr, errorMsgBody);
                    return null;
                });
                return promise;
            }
        }
    }
)
