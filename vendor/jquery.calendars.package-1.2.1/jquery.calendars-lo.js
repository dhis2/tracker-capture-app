/* http://keith-wood.name/calendars.html
   Laos localisation for Gregorian/Julian calendars for jQuery.
   Stuart. */
(function ($) {
  $.calendars.calendars.gregorian.prototype.regional["lo"] = {
    name: "Gregorian",
    epochs: ["BCE", "CE"],
    monthNames: ["ເດືອນມັງກອນ", "ເດືອນກຸມພາ", "ເດືອນມີນາ", "ເດືອນເມສາ", "ເດືອນພຶດສະພາ", "ເດືອນມິຖຸນາ", "ເດືອນກໍລະກົດ", "ເດືອນສິງຫາ", "ເດືອນກັນຍາ", "ເດືອນຕຸລາ", "ເດືອນພະຈິກ", "ເດືອນທັນວາ"],
    monthNamesShort: ["ມັງກອນ", "ກຸມພາ", "ມີນາ", "ເມສາ", "ພຶດສະພາ", "ມິຖຸນາ", "ກໍລະກົດ", "ສິງຫາ", "ກັນຍາ", "ຕຸລາ", "ພະຈິກ", "ທັນວາ"],
    dayNames: ["ວັນອາທິດ", "ວັນຈັນ", "ວັນອັງຄານ", "ວັນພຸດ", "ວັນພະຫັດ", "ວັນສຸກ", "ວັນເສົາ"],
    dayNamesShort: ["ທິດ", "ຈັນ", "ຄານ", "ພຸດ", "ພະຫັດ", "ສຸກ", "ເສົາ"],
    dayNamesMin: ["ທ", "ຈ", "ຄ", "ພ", "ພຫ", "ສ", "ສ"],
    dateFormat: "ວັນທີ/ເດືອນ/ປີ",
    firstDay: 1,
    isRTL: false
  };
  if ($.calendars.calendars.julian) {
    $.calendars.calendars.julian.prototype.regional["lo"] = $.calendars.calendars.gregorian.prototype.regional["lo"];
  }
})(jQuery);
