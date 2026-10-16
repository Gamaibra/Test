/*
 * The Pearl of Africa: shop details, in one place.
 * Edit this file to update the address, phone numbers or opening hours.
 * Anything left empty ("" / null / []) is simply not shown on the site.
 *
 * Sources: the Oryx Village flyer and menu (same group) and the storefront photo.
 */
window.SHOP = {
  name: "The Pearl of Africa",
  nameArabic: "ذا بيرل اوف افريكا",

  // No slogan was found in the Oryx Village sources. Fill in once confirmed.
  slogan: "",

  address: {
    street: "Naif Road, Deira, Dubai",
    landmark: "Opposite side of Al Futtaim Mosque, near Venom Club (DJ Ram)",
    country: "United Arab Emirates",
    // Google Maps has no verified pin for the shop yet: directions point to the mosque opposite.
    mapsQuery: "Al Futtaim Mosque, Naif Road, Deira, Dubai"
  },

  phones: [
    { label: "The Pearl of Africa", number: "+971 52 212 6655", whatsapp: true, primary: true },
    { label: "Oryx Village (same group)", number: "+971 58 193 4455", whatsapp: true },
    { label: "Oryx Village (same group)", number: "+971 50 404 8709", whatsapp: false }
  ],

  whatsappMessage: "Hello The Pearl of Africa!",

  // Not confirmed yet: leave empty until the shop provides them.
  hours: [],        // e.g. ["Mon–Sat · 9:00–22:00", "Sun · 10:00–20:00"]
  email: "",        // e.g. "hello@example.com"
  socials: [],      // e.g. [{ label: "Instagram", url: "https://instagram.com/..." }]

  media: {
    frameCount: 80,
    framePath: "media/frames/f{n}.webp"
  }
};
