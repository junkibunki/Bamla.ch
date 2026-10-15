// Hecken, Mauern, Zäune, Sträucher, Blumen und Kübel am Straßenrand, Straße für Straße nach Street View und Luftbild DOP20.
// Koordinaten in lokalen Metern (x Ost, z Süd). Typen (strassengruen.js):
//   hedge  { pts, h, w, kind: thuja|laurel|privet|hornbeam|beech|copper|boxwood|yew|conifer|mixed|wild|bamboo|ivy, color?, flower? }
//   wall   { pts, h, w, mat: stone|plaster|concrete|sandstone|limestone|brick|gabion|granite, color?, capColor?, cap?, fence?, fenceH? }
//   fence  { pts, h, style: wood|picket|panel|wire|metal|privacy|rustic|white, color? }
//   shrub  { p, r, h, kind: green|conifer|boxwood|flowering|hydrangea|rose|grass, color?, flower? }
//   flowers{ pts, w | p, r; colors[], h }   planter { p, kind: pot|trough|barrel, r?, color?, colors[], rot? }
export const GRUEN = [
  // ===== Alte Weinstraße =====
  { street: 'Alte Weinstraße', t: 'wall', pts: [[-131.4, -52], [-133.9, -45.5]], h: 0.7, w: 0.3, mat: 'concrete', color: '#cbc7be', fence: 'wire', fenceH: 0.8 }, // P30R+P00L+Luftbild
  { street: 'Alte Weinstraße', t: 'wall', pts: [[-133.9, -45.5], [-136.1, -39.9], [-138.3, -34.3], [-139.5, -31]], h: 1, w: 0.3, mat: 'concrete', color: '#cfcac0' }, // P00L+Luftbild
  { street: 'Alte Weinstraße', t: 'fence', pts: [[-138.2, -57.4], [-139, -53.8], [-139.7, -52.2], [-141.9, -46.6], [-144, -41], [-146.2, -35.4], [-147.4, -32.1]], h: 1, style: 'metal', color: '#2f4a35' }, // P00R+P30R
  { street: 'Alte Weinstraße', t: 'shrub', p: [-141.7, -52.7], r: 1.6, h: 2.8, kind: 'green', color: '#3d5a2c' }, // P00R+Luftbild
  { street: 'Alte Weinstraße', t: 'shrub', p: [-143.8, -47.2], r: 1.4, h: 2.5, kind: 'green', color: '#45652f' }, // P00R+Luftbild
  { street: 'Alte Weinstraße', t: 'wall', pts: [[-148.4, -30.3], [-150.5, -24.7], [-152, -22]], h: 0.5, w: 0.4, mat: 'limestone', color: '#c8b99a' }, // P01R
  { street: 'Alte Weinstraße', t: 'wall', pts: [[-144.1, -19.1], [-147.2, -13.9], [-149.1, -10.6], [-150, -9.4]], h: 1.8, w: 0.5, mat: 'stone', color: '#8d877b', fence: 'wood', fenceH: 0.9 }, // P01L+Luftbild
  { street: 'Alte Weinstraße', t: 'wall', pts: [[-150, -9.4], [-153.7, -4.7], [-157.3, 0.1], [-159.5, 2.9]], h: 1.3, w: 0.5, mat: 'stone', color: '#8d877b' }, // P01L+P03L+Luftbild
  { street: 'Alte Weinstraße', t: 'shrub', p: [-151.1, -4.9], r: 0.6, h: 1.8, kind: 'grass', color: '#d9cfa8' }, // P01L
  { street: 'Alte Weinstraße', t: 'shrub', p: [-153.9, -2.1], r: 0.4, h: 1.8, kind: 'conifer', color: '#2e4a2a' }, // P01L
  { street: 'Alte Weinstraße', t: 'shrub', p: [-159.6, 2.4], r: 0.5, h: 1.6, kind: 'conifer', color: '#3a5a2c' }, // P03L
  { street: 'Alte Weinstraße', t: 'fence', pts: [[-159.9, -11.5], [-163.6, -6.8], [-166.9, -2.5], [-173.1, 4.1]], h: 0.9, style: 'wire', color: '#7d8478' }, // P03R+Luftbild
  { street: 'Alte Weinstraße', t: 'shrub', p: [-166.6, -6.2], r: 1.8, h: 3.5, kind: 'green', color: '#3f5a2e' }, // P03R+Luftbild
  { street: 'Alte Weinstraße', t: 'shrub', p: [-169.7, -3.2], r: 1.3, h: 2, kind: 'green', color: '#7f9a3e' }, // P03R+Luftbild
  { street: 'Alte Weinstraße', t: 'shrub', p: [-172.4, -0.3], r: 1.6, h: 2.8, kind: 'green', color: '#2f4526' }, // P03R+Luftbild
  { street: 'Alte Weinstraße', t: 'wall', pts: [[-181.1, 15.1], [-184.5, 20.1], [-186.8, 24.1]], h: 0.7, w: 0.3, mat: 'concrete', color: '#c4c0b6', fence: 'metal', fenceH: 0.6 }, // P04R+P04L+Luftbild
  { street: 'Alte Weinstraße', t: 'shrub', p: [-183.3, 37.5], r: 1.2, h: 0.5, kind: 'green', color: '#4f7d32' }, // P05L+Luftbild
  { street: 'Alte Weinstraße', t: 'hedge', pts: [[-205.6, 45.6], [-201.3, 45.5], [-201.9, 53.3], [-206.8, 53.3]], h: 1.2, w: 0.8, kind: 'laurel', color: '#2f4a26' }, // P05R+P06R+Luftbild
  { street: 'Alte Weinstraße', t: 'shrub', p: [-202.3, 54.4], r: 0.5, h: 0.8, kind: 'grass', color: '#8aa04a' }, // P06R
  { street: 'Alte Weinstraße', t: 'wall', pts: [[-230.2, 96.4], [-232.5, 102], [-234.7, 107.6], [-236.9, 113.1], [-239.1, 118.7], [-241.4, 124.3], [-243.6, 129.8], [-246, 136]], h: 2.2, w: 0.5, mat: 'stone', color: '#b0aa9e', cap: false }, // P08L+P09L+P10L+Luftbild
  { street: 'Alte Weinstraße', t: 'wall', pts: [[-240.1, 140.6], [-241.9, 145.1], [-242.7, 146.5], [-245.3, 151.4]], h: 0.4, w: 0.5, mat: 'limestone', color: '#bdb6a6', cap: false }, // P11L
  { street: 'Alte Weinstraße', t: 'hedge', pts: [[-238.2, 114.5], [-241.4, 122.4]], h: 0.8, w: 1.2, kind: 'mixed', color: '#5d7f3a' }, // P09R+Luftbild
  { street: 'Alte Weinstraße', t: 'shrub', p: [-242.7, 119.1], r: 0.6, h: 2.2, kind: 'conifer', color: '#2f4a2a' }, // P09R
  { street: 'Alte Weinstraße', t: 'planter', p: [-241.8, 123.6], r: 0.4, kind: 'pot', color: '#b4643c', colors: ['#4e7a2c'] }, // P10R
  { street: 'Alte Weinstraße', t: 'planter', p: [-242.6, 125.6], r: 0.4, kind: 'pot', color: '#b4643c', colors: ['#4e7a2c'] }, // P10R
  { street: 'Alte Weinstraße', t: 'planter', p: [-243.4, 127.5], r: 0.4, kind: 'pot', color: '#b4643c', colors: ['#4e7a2c'] }, // P10R
  { street: 'Alte Weinstraße', t: 'shrub', p: [-251.8, 142.6], r: 1.3, h: 2.4, kind: 'green', color: '#557a30' }, // P11R+Luftbild
  { street: 'Alte Weinstraße', t: 'shrub', p: [-252.1, 144.2], r: 0.4, h: 0.8, kind: 'boxwood', color: '#3f6a2a' }, // P11R
  { street: 'Alte Weinstraße', t: 'shrub', p: [-253.9, 147.5], r: 0.4, h: 0.8, kind: 'boxwood', color: '#3f6a2a' }, // P11R
  { street: 'Alte Weinstraße', t: 'shrub', p: [-256.1, 149.4], r: 0.4, h: 1.2, kind: 'conifer', color: '#2f4f2a' }, // P11R
  { street: 'Alte Weinstraße', t: 'flowers', p: [-257.9, 177.5], r: 0.7, h: 0.3, colors: ['#f2c12e', '#f08c1a', '#e8d84a'] }, // P13L
  { street: 'Alte Weinstraße', t: 'shrub', p: [-260.5, 182], r: 1.5, h: 2.2, kind: 'green', color: '#6a9a3a' }, // P13L
  { street: 'Alte Weinstraße', t: 'fence', pts: [[-263.2, 165.7], [-266.5, 170.7], [-270, 174.9], [-275.8, 181.7], [-278.8, 183.6], [-281.7, 185.6], [-283.3, 186.5], [-288.7, 189.1], [-294.1, 191.8], [-299, 193.1], [-302.4, 194], [-304.5, 194.4]], h: 0.9, style: 'wood', color: '#8a877e' }, // P12R+P13R+P34L+P33L+Luftbild
  { street: 'Alte Weinstraße', t: 'hedge', pts: [[-263.5, 167.6], [-265.8, 171.2], [-266.7, 172.2], [-270.5, 176.8], [-274.3, 181.2]], h: 0.5, w: 0.6, kind: 'boxwood', color: '#5f7a4a' }, // P13R
  { street: 'Alte Weinstraße', t: 'shrub', p: [-287, 186.5], r: 1.8, h: 3, kind: 'flowering', color: '#4f6e35', flower: '#a77bc4' }, // P34L
  { street: 'Alte Weinstraße', t: 'hedge', pts: [[-303.2, 192.8], [-299.5, 186.5]], h: 1.6, w: 0.8, kind: 'privet', color: '#4d7a2e' }, // P33L+Luftbild
  { street: 'Alte Weinstraße', t: 'shrub', p: [-295.5, 190], r: 1, h: 2.2, kind: 'flowering', color: '#4f6e35', flower: '#9b7fd0' }, // P33L
  { street: 'Alte Weinstraße', t: 'flowers', p: [-300.5, 203.6], r: 1.1, h: 0.3, colors: ['#f4f4f0', '#d9cf3a'] }, // P33R
  { street: 'Alte Weinstraße', t: 'shrub', p: [-299.3, 203.2], r: 0.6, h: 0.8, kind: 'green', color: '#c8c440' }, // P33R
  { street: 'Alte Weinstraße', t: 'shrub', p: [-302.3, 204.6], r: 1.5, h: 3, kind: 'flowering', color: '#4c6a32', flower: '#a372c0' }, // P33R
  { street: 'Alte Weinstraße', t: 'shrub', p: [-306.9, 205], r: 2, h: 3, kind: 'green', color: '#3a5a2a' }, // P32R+Luftbild
  { street: 'Alte Weinstraße', t: 'hedge', pts: [[-349.8, 222.2], [-344.9, 218.9], [-341.8, 216.9], [-336.3, 214.3], [-328.7, 211.7], [-323.7, 210.8], [-317.8, 209.6], [-311, 208.1]], h: 2.5, w: 1.2, kind: 'privet', color: '#4f7f2c' }, // P32R+P36R+P35R+Luftbild
  { street: 'Alte Weinstraße', t: 'shrub', p: [-341.8, 201.5], r: 0.9, h: 1.5, kind: 'green', color: '#8f3b2e' }, // P36L
  { street: 'Alte Weinstraße', t: 'flowers', p: [-343, 203.5], r: 0.6, h: 0.4, colors: ['#d32f2f', '#f0c419'] }, // P36L
  { street: 'Alte Weinstraße', t: 'shrub', p: [-341.5, 198.5], r: 0.8, h: 1.6, kind: 'green', color: '#5f8a3a' }, // P36L
  { street: 'Alte Weinstraße', t: 'wall', pts: [[-181.4, -200.8], [-175.9, -199.2], [-170.2, -197.6], [-164.4, -196]], h: 0.9, w: 0.5, mat: 'limestone', color: '#b9a98a', cap: false }, // P28R+Luftbild
  { street: 'Alte Weinstraße', t: 'hedge', pts: [[-179.3, -201.1], [-175.6, -200.1], [-169.8, -198.5]], h: 1.8, w: 1.2, kind: 'privet', color: '#7ea33f' }, // P28R+Luftbild
  { street: 'Alte Weinstraße', t: 'wall', pts: [[-149.1, -192.4], [-143.1, -190.6]], h: 0.4, w: 0.3, mat: 'plaster', color: '#d8cdb5', fence: 'metal', fenceH: 0.8 }, // P27R
  { street: 'Alte Weinstraße', t: 'fence', pts: [[-172.6, -190.4], [-168.9, -189.4], [-163.1, -187.8]], h: 0.9, style: 'picket', color: '#7a5a3c' }, // P27L+P28L+Luftbild
  { street: 'Alte Weinstraße', t: 'hedge', pts: [[-189.5, -193.5], [-192, -195.7]], h: 1.2, w: 1, kind: 'privet', color: '#4a6b2f' }, // P29L
  { street: 'Alte Weinstraße', t: 'hedge', pts: [[-126, -146.6], [-127.1, -140.7], [-128.3, -134.3]], h: 2, w: 1.8, kind: 'mixed', color: '#3f5f2c' }, // Luftbild
  // ===== Am Buck =====
  { street: 'Am Buck', t: 'fence', pts: [[-27.6, -196.9], [-26.9, -187.4]], h: 1, style: 'wire', color: '#7a5a3a' }, // P00R+Luftbild
  { street: 'Am Buck', t: 'shrub', p: [-27.8, -191.6], r: 1, h: 1.3, kind: 'green', color: '#3f6a2e' }, // P00R+Luftbild
  { street: 'Am Buck', t: 'shrub', p: [-27.5, -189.2], r: 0.9, h: 1.1, kind: 'green', color: '#4a7535' }, // P00R+Luftbild
  { street: 'Am Buck', t: 'wall', pts: [[-20.6, -184.6], [-20.1, -177.1]], h: 0.5, w: 0.3, mat: 'concrete', color: '#b5b1a7' }, // P00L+Luftbild
  { street: 'Am Buck', t: 'hedge', pts: [[-20.4, -184.2], [-19.9, -177.3]], h: 0.9, w: 0.8, kind: 'mixed' }, // P00L+Luftbild
  { street: 'Am Buck', t: 'wall', pts: [[-19.7, -176.1], [-17.5, -171], [-14.3, -168.3], [-9.8, -166.3]], h: 0.5, w: 0.3, mat: 'concrete', color: '#b8b4aa' }, // P01L+Luftbild
  { street: 'Am Buck', t: 'flowers', pts: [[-18.9, -174.8], [-16.6, -170.2], [-13.3, -168.2]], h: 0.5, w: 1.2, colors: ['#7d6fb0', '#e8e8ef', '#9c8cc8'] }, // P01L
  { street: 'Am Buck', t: 'wall', pts: [[-20.2, -158.1], [-18.1, -163.6], [-16.8, -162.7], [-12.3, -160.7]], h: 0.8, w: 0.3, mat: 'concrete', color: '#a8a49a' }, // P01L+P01R+Luftbild
  { street: 'Am Buck', t: 'hedge', pts: [[-19.8, -158.2], [-17.9, -163.1], [-16.7, -162.2], [-12.4, -160.3]], h: 2.6, w: 1.2, kind: 'privet', color: '#2f5a26' }, // P01L+P01R+Luftbild
  { street: 'Am Buck', t: 'wall', pts: [[-25.5, -161.5], [-24.2, -164.8], [-29.5, -166]], h: 0.8, w: 0.3, mat: 'concrete', color: '#a9a59b', fence: 'wire', fenceH: 1 }, // P01R+Luftbild
  { street: 'Am Buck', t: 'hedge', pts: [[-8.5, -170.5], [2, -170.5]], h: 0.9, w: 0.8, kind: 'mixed', color: '#4a5e2e' }, // P02L+Luftbild
  { street: 'Am Buck', t: 'shrub', p: [17.3, -162.4], r: 0.8, h: 1.8, kind: 'conifer', color: '#4a6a3a' }, // P03L+Luftbild
  { street: 'Am Buck', t: 'shrub', p: [16.4, -154], r: 1.8, h: 4, kind: 'green', color: '#2b4626' }, // P03R+P02L+Luftbild
  { street: 'Am Buck', t: 'shrub', p: [18.8, -154.1], r: 0.9, h: 1.2, kind: 'green', color: '#355a2c' }, // P03R+Luftbild
  { street: 'Am Buck', t: 'flowers', pts: [[10.7, -155.3], [14.5, -155.1]], h: 0.4, w: 0.8, colors: ['#8a9a7a', '#b07ab0'] }, // P03R
  // ===== Am Golfplatz =====
  { street: 'Am Golfplatz', t: 'fence', pts: [[127.4, -139.9], [137.4, -134.7], [146.9, -129.8]], h: 1, style: 'rustic', color: '#7b5a3c' }, // P01R+P00R
  { street: 'Am Golfplatz', t: 'shrub', p: [131.4, -140.3], r: 1.4, h: 2.2, kind: 'flowering', color: '#5c7a3a', flower: '#d9547a' }, // P01R
  { street: 'Am Golfplatz', t: 'shrub', p: [135.4, -138.2], r: 1.3, h: 2.5, kind: 'green', color: '#7a9e3e' }, // P01R
  { street: 'Am Golfplatz', t: 'shrub', p: [140.2, -136.3], r: 1.5, h: 3, kind: 'green', color: '#6b8f3a' }, // P01R
  { street: 'Am Golfplatz', t: 'flowers', p: [149.2, -129.7], r: 0.8, h: 0.3, colors: ['#8a6fc0', '#a58ad6'] }, // P00R (Blaukissen)
  { street: 'Am Golfplatz', t: 'flowers', p: [150.3, -128.8], r: 0.5, h: 0.3, colors: ['#f2d640'] }, // P00R
  { street: 'Am Golfplatz', t: 'shrub', p: [151.5, -128.2], r: 1, h: 0.7, kind: 'conifer', color: '#5c7f4a' }, // P00R (Wacholder)
  { street: 'Am Golfplatz', t: 'shrub', p: [152.4, -129.3], r: 0.4, h: 0.6, kind: 'grass', color: '#7f9a55' }, // P00R
  { street: 'Am Golfplatz', t: 'shrub', p: [153.5, -127.5], r: 1.2, h: 1.6, kind: 'conifer', color: '#9fb84a' }, // P00R
  { street: 'Am Golfplatz', t: 'shrub', p: [153.6, -129.7], r: 1.3, h: 2, kind: 'conifer', color: '#86a93c' }, // P00R
  { street: 'Am Golfplatz', t: 'shrub', p: [151.6, -132.7], r: 1, h: 3, kind: 'conifer', color: '#2f4f2f' }, // P00R
  { street: 'Am Golfplatz', t: 'hedge', pts: [[161.5, -122.5], [166.4, -119.4], [172.1, -115.9]], h: 2, w: 2, kind: 'wild' }, // P17R+Luftbild
  { street: 'Am Golfplatz', t: 'hedge', pts: [[117.5, -138], [123.5, -134.8], [129.5, -131.7]], h: 1.8, w: 1.5, kind: 'mixed', color: '#36552c' }, // P01L+Luftbild
  { street: 'Am Golfplatz', t: 'shrub', p: [141, -124.6], r: 1.1, h: 1.5, kind: 'conifer', color: '#2f4d2c' }, // P00L
  { street: 'Am Golfplatz', t: 'shrub', p: [143.3, -123.4], r: 1.1, h: 1.5, kind: 'conifer', color: '#3a5a32' }, // P00L
  { street: 'Am Golfplatz', t: 'shrub', p: [148, -121], r: 0.8, h: 1, kind: 'boxwood', color: '#3f5f2e' }, // P00L+P17L
  { street: 'Am Golfplatz', t: 'shrub', p: [151.5, -119.1], r: 0.9, h: 1.2, kind: 'boxwood', color: '#3f5f2e' }, // P17L
  { street: 'Am Golfplatz', t: 'wall', pts: [[153, -118.4], [153.3, -116.3], [153.4, -114.2]], h: 0.7, w: 0.6, mat: 'stone', color: '#9a9184', cap: false }, // P17L (Steingarten)
  { street: 'Am Golfplatz', t: 'shrub', p: [153.4, -116.7], r: 1, h: 0.6, kind: 'green', color: '#5aa03e' }, // P17L
  { street: 'Am Golfplatz', t: 'wall', pts: [[296, -85.5], [296.5, -88.7], [299.3, -93.7]], h: 0.8, w: 0.8, mat: 'limestone', color: '#b8afa3', cap: false }, // P14R+P13R (Findlinge)
  { street: 'Am Golfplatz', t: 'hedge', pts: [[308.6, -83.4], [312.3, -80.3]], h: 1.5, w: 1.2, kind: 'laurel', color: '#b23a30' }, // P13R+Luftbild (Glanzmispel)
  { street: 'Am Golfplatz', t: 'wall', pts: [[313, -82.5], [313.6, -86.5], [315, -91]], h: 0.8, w: 0.8, mat: 'limestone', color: '#b8afa3', cap: false }, // P13R+Luftbild (Findlinge)
  { street: 'Am Golfplatz', t: 'hedge', pts: [[284.3, -78.8], [299.4, -75.5], [319.3, -71.3], [339.2, -67.1], [351.2, -64]], h: 3.5, w: 3, kind: 'wild' }, // P14L+P13L+Luftbild
  { street: 'Am Golfplatz', t: 'wall', pts: [[344.8, -79.5], [346.5, -78], [348.6, -76.4]], h: 0.5, w: 0.7, mat: 'limestone', color: '#d8d2c6', cap: false }, // P07L (Findlinge)
  { street: 'Am Golfplatz', t: 'hedge', pts: [[349, -72.8], [356, -71], [363.1, -69.2]], h: 2.5, w: 3, kind: 'wild' }, // P11R+Luftbild
  { street: 'Am Golfplatz', t: 'shrub', p: [378, -67.5], r: 0.5, h: 0.8, kind: 'green', color: '#5f8a3a' }, // Luftbild+P09R
  { street: 'Am Golfplatz', t: 'shrub', p: [384, -66.5], r: 0.5, h: 0.8, kind: 'green', color: '#5f8a3a' }, // Luftbild+P09R
  { street: 'Am Golfplatz', t: 'shrub', p: [390, -65.5], r: 0.5, h: 0.8, kind: 'green', color: '#5f8a3a' }, // Luftbild+P09R
  { street: 'Am Golfplatz', t: 'shrub', p: [443, -48.5], r: 0.5, h: 0.8, kind: 'green', color: '#5f8a3a' }, // Luftbild+P09R
  { street: 'Am Golfplatz', t: 'shrub', p: [447, -47.8], r: 0.5, h: 0.8, kind: 'green', color: '#5f8a3a' }, // Luftbild+P09R
  { street: 'Am Golfplatz', t: 'shrub', p: [451, -47], r: 0.5, h: 0.8, kind: 'green', color: '#5f8a3a' }, // Luftbild+P09R
  { street: 'Am Golfplatz', t: 'hedge', pts: [[459.3, -46], [459.5, -52]], h: 1.4, w: 1, kind: 'hornbeam', color: '#86b04a' }, // P08R+P21R
  { street: 'Am Golfplatz', t: 'shrub', p: [464.5, -43], r: 2, h: 1.4, kind: 'green', color: '#4c7a2c' }, // P21R+Luftbild (Formhecke)
  { street: 'Am Golfplatz', t: 'hedge', pts: [[468, -41.5], [480, -38.5], [492, -35.3]], h: 1.8, w: 1, kind: 'hornbeam', color: '#86b04a' }, // P21R+P20R+P19R+Luftbild
  // ===== Am Sonnenrain =====
  { street: 'Am Sonnenrain', t: 'wall', pts: [[-914.7, 861.2], [-918.9, 863.8], [-924, 865.6]], h: 0.4, w: 0.4, mat: 'stone', color: '#a8a090' }, // P01R
  { street: 'Am Sonnenrain', t: 'shrub', p: [-917.3, 861.6], r: 0.8, h: 1.2, kind: 'green' }, // P01R
  { street: 'Am Sonnenrain', t: 'shrub', p: [-921.3, 863.7], r: 0.7, h: 1, kind: 'green' }, // P01R
  { street: 'Am Sonnenrain', t: 'shrub', p: [-922.9, 864.6], r: 0.5, h: 0.7, kind: 'grass', color: '#b0b070' }, // P01R
  { street: 'Am Sonnenrain', t: 'fence', pts: [[-924.1, 865.4], [-926.6, 866]], h: 1, style: 'metal', color: '#222222' }, // P01R
  { street: 'Am Sonnenrain', t: 'shrub', p: [-926.4, 864.5], r: 0.9, h: 1.5, kind: 'green' }, // P01R
  { street: 'Am Sonnenrain', t: 'fence', pts: [[-1239.3, 937.4], [-1232, 936.5]], h: 1, style: 'panel', color: '#9a9ea2' }, // Dürrenmatten P08L+Luftbild
  // ===== Bamlacher Straße =====
  { street: 'Bamlacher Straße', t: 'hedge', pts: [[-914.9, 503], [-922, 510.1], [-929.1, 517.2], [-936.1, 524.4], [-943, 531.5]], h: 3, w: 2.5, kind: 'wild' }, // P5R+P6R
  { street: 'Bamlacher Straße', t: 'shrub', p: [-948.4, 537.5], r: 1.5, h: 2.5, kind: 'green' }, // P7R
  { street: 'Bamlacher Straße', t: 'shrub', p: [-1008.9, 596], r: 1, h: 3.5, kind: 'conifer', color: '#2f4a2c' }, // P10R
  { street: 'Bamlacher Straße', t: 'shrub', p: [-1010.7, 597.6], r: 1.2, h: 3.8, kind: 'conifer', color: '#2f4a2c' }, // P10R
  { street: 'Bamlacher Straße', t: 'shrub', p: [-1012.6, 599.3], r: 0.7, h: 3.6, kind: 'conifer', color: '#2f4a2c' }, // P10R
  { street: 'Bamlacher Straße', t: 'hedge', pts: [[-1035.4, 619.5], [-1041.3, 624.6], [-1047.5, 629.6], [-1053.7, 634.6]], h: 2.8, w: 2.2, kind: 'wild' }, // P12R+P13R
  { street: 'Bamlacher Straße', t: 'fence', pts: [[-927.6, 538.4], [-929.8, 536.3], [-934.7, 541.3]], h: 0.9, style: 'rustic', color: '#8c7c68' }, // P5L+P6L
  { street: 'Bamlacher Straße', t: 'fence', pts: [[-930.5, 542.8], [-935, 543.2]], h: 1.8, style: 'privacy', color: '#b39370' }, // P6L
  { street: 'Bamlacher Straße', t: 'fence', pts: [[-925.6, 528.2], [-921.4, 524]], h: 0.9, style: 'rustic', color: '#b8b2a4' }, // P5L
  { street: 'Bamlacher Straße', t: 'hedge', pts: [[-934.1, 540.3], [-938.9, 545.3], [-943.8, 550.3]], h: 3.2, w: 3, kind: 'wild' }, // P6L+P7L+Luftbild
  { street: 'Bamlacher Straße', t: 'shrub', p: [-946.3, 556.2], r: 2.5, h: 3.8, kind: 'green' }, // P7L+Luftbild
  { street: 'Bamlacher Straße', t: 'hedge', pts: [[-954.7, 561.1], [-961.3, 567.2]], h: 1.8, w: 2, kind: 'wild' }, // P8L
  { street: 'Bamlacher Straße', t: 'shrub', p: [-951.3, 558.4], r: 1.2, h: 1.5, kind: 'green' }, // P8L
  { street: 'Bamlacher Straße', t: 'wall', pts: [[-998, 601.2], [-1003.2, 606], [-1008.4, 610.6], [-1013.6, 615.3], [-1018.8, 620]], h: 0.5, w: 0.4, mat: 'concrete', color: '#8e8b84', cap: false }, // P10L+P11L+Luftbild
  { street: 'Bamlacher Straße', t: 'hedge', pts: [[-996.3, 603], [-1001.7, 608], [-1007.1, 612.8], [-1012.5, 617.7], [-1017.9, 622.5]], h: 1.3, w: 0.8, kind: 'privet', color: '#2f5528' }, // P10L+P11L+Luftbild
  { street: 'Bamlacher Straße', t: 'hedge', pts: [[-1020.6, 622.5], [-1022.5, 626.3], [-1024.5, 630.1]], h: 0.8, w: 0.7, kind: 'mixed' }, // P11L+P12L
  { street: 'Bamlacher Straße', t: 'hedge', pts: [[-1037.5, 634.5], [-1032, 635.5], [-1027.5, 638.5], [-1025, 641]], h: 1, w: 0.8, kind: 'laurel', color: '#2c5226' }, // P12L+P13L+Luftbild
  { street: 'Bamlacher Straße', t: 'wall', pts: [[-1034.7, 641.4], [-1037.2, 641.5], [-1049.6, 651.6], [-1049.2, 654.4]], h: 0.4, w: 0.3, mat: 'concrete', color: '#d9d8d2', cap: false }, // P13L
  { street: 'Bamlacher Straße', t: 'shrub', p: [-1042, 649.1], r: 0.6, h: 1.2, kind: 'green' }, // P13L
  { street: 'Bamlacher Straße', t: 'hedge', pts: [[-1056.7, 648.7], [-1054.2, 652.6], [-1051.5, 656.6]], h: 1.3, w: 0.7, kind: 'privet' }, // P14L
  { street: 'Bamlacher Straße', t: 'fence', pts: [[-1053.5, 663], [-1061, 651], [-1060.5, 653.6], [-1070.7, 660.8], [-1067.4, 666.8]], h: 1.1, style: 'wire', color: '#7d887c' }, // P14L+P15L
  { street: 'Bamlacher Straße', t: 'fence', pts: [[-1076.8, 665.1], [-1080.8, 668.1], [-1084.8, 671.1]], h: 1, style: 'panel', color: '#8c9090' }, // P15L
  { street: 'Bamlacher Straße', t: 'shrub', p: [-1078.6, 667.7], r: 1.3, h: 1.4, kind: 'green' }, // P15L
  { street: 'Bamlacher Straße', t: 'fence', pts: [[-1095.7, 678.7], [-1095, 686.6]], h: 1.1, style: 'metal', color: '#2e2e2e' }, // P16L
  { street: 'Bamlacher Straße', t: 'shrub', p: [-1096.3, 678.7], r: 0.4, h: 1.9, kind: 'conifer', color: '#3d5f2e' }, // P16L
  { street: 'Bamlacher Straße', t: 'shrub', p: [-1096.1, 680.7], r: 0.4, h: 1.9, kind: 'conifer', color: '#3d5f2e' }, // P16L
  { street: 'Bamlacher Straße', t: 'shrub', p: [-1095.9, 682.7], r: 0.4, h: 1.9, kind: 'conifer', color: '#3d5f2e' }, // P16L
  { street: 'Bamlacher Straße', t: 'shrub', p: [-1095.8, 684.6], r: 0.4, h: 1.9, kind: 'conifer', color: '#3d5f2e' }, // P16L
  { street: 'Bamlacher Straße', t: 'shrub', p: [-1095.6, 686.6], r: 0.4, h: 1.9, kind: 'conifer', color: '#3d5f2e' }, // P16L
  { street: 'Bamlacher Straße', t: 'fence', pts: [[-1106.8, 685.6], [-1111.1, 688.3], [-1115.3, 691], [-1120.2, 694]], h: 1.7, style: 'wood', color: '#5e6a80' }, // P17L
  { street: 'Bamlacher Straße', t: 'hedge', pts: [[-1121.6, 694.3], [-1129.4, 697.9]], h: 1, w: 1, kind: 'privet', color: '#3f6a34' }, // P17L+P18L
  { street: 'Bamlacher Straße', t: 'wall', pts: [[-1155.4, 668.6], [-1161.8, 666.9]], h: 1.1, w: 0.4, mat: 'stone', color: '#a39d90', fence: 'wire', fenceH: 0.8 }, // P22L+P23L+Luftbild
  { street: 'Bamlacher Straße', t: 'wall', pts: [[-1161.8, 666.9], [-1171, 665.1]], h: 1.1, w: 0.4, mat: 'stone', color: '#a39d90' }, // P23L+Luftbild
  { street: 'Bamlacher Straße', t: 'shrub', p: [-1159.8, 670], r: 2, h: 3.5, kind: 'green' }, // P22L
  { street: 'Bamlacher Straße', t: 'wall', pts: [[-1186.2, 658.3], [-1186, 656.3], [-1193.5, 653.4]], h: 0.3, w: 0.2, mat: 'concrete', color: '#d6d4ce', fence: 'metal', fenceH: 0.6 }, // P24L+P25L
  { street: 'Bamlacher Straße', t: 'wall', pts: [[-1199, 651.5], [-1208.5, 648.2]], h: 0.3, w: 0.2, mat: 'concrete', color: '#cfcdc6', fence: 'metal', fenceH: 0.6 }, // P19R+P25L
  { street: 'Bamlacher Straße', t: 'hedge', pts: [[-1199.3, 652.3], [-1207.8, 649.3]], h: 0.6, w: 0.5, kind: 'boxwood' }, // P19R
  { street: 'Bamlacher Straße', t: 'shrub', p: [-1190.5, 657], r: 0.8, h: 1.3, kind: 'green' }, // P25L
  { street: 'Bamlacher Straße', t: 'wall', pts: [[-1155.5, 658], [-1159.5, 656.2], [-1169.5, 652.6]], h: 0.3, w: 0.3, mat: 'concrete', color: '#c9c6bd', fence: 'wire', fenceH: 0.9 }, // P23R+P22L+Hux-P00L
  { street: 'Bamlacher Straße', t: 'fence', pts: [[-1169.5, 652.6], [-1176, 650.4], [-1181.8, 648.5]], h: 0.9, style: 'rustic', color: '#5a4130' }, // P23R+P24R
  { street: 'Bamlacher Straße', t: 'fence', pts: [[-1181.8, 648.5], [-1181.5, 644.5]], h: 0.8, style: 'rustic', color: '#5a4130' }, // P24R
  { street: 'Bamlacher Straße', t: 'fence', pts: [[-1202, 632.8], [-1196.5, 636.2], [-1191.5, 639.2], [-1191, 636.5]], h: 0.8, style: 'rustic', color: '#6b4a30' }, // P19L+P25R
  { street: 'Bamlacher Straße', t: 'shrub', p: [-1177.5, 647], r: 2, h: 4, kind: 'flowering', flower: '#a971b5' }, // P23R+P24R+P19L
  { street: 'Bamlacher Straße', t: 'shrub', p: [-1196, 635], r: 2, h: 4, kind: 'flowering', flower: '#b67fc0' }, // P19L+P25R
  { street: 'Bamlacher Straße', t: 'shrub', p: [-1170, 649.5], r: 1.8, h: 3.5, kind: 'green' }, // P22L+Luftbild
  { street: 'Bamlacher Straße', t: 'planter', p: [-1189.2, 642], r: 0.4, kind: 'pot', color: '#e8e6e0', colors: ['#f1f1f3', '#c9d2c9'] }, // P24R+P25R
  { street: 'Bamlacher Straße', t: 'planter', p: [-1187.8, 642.6], r: 0.4, kind: 'pot', color: '#e8e6e0', colors: ['#f1f1f3', '#c9d2c9'] }, // P24R+P25R
  { street: 'Bamlacher Straße', t: 'flowers', p: [-1186.8, 643], r: 0.7, h: 0.3, colors: ['#9a68b8', '#b48ad0'] }, // P25R
  { street: 'Bamlacher Straße', t: 'planter', p: [-1193.6, 634.2], r: 0.3, kind: 'pot', color: '#a0442c', colors: ['#5c7d3c'] }, // P19L
  { street: 'Bamlacher Straße', t: 'planter', p: [-1189.3, 638.4], r: 0.3, kind: 'pot', color: '#b8483a', colors: ['#d8485e'] }, // P19L
  { street: 'Bamlacher Straße', t: 'planter', p: [-1189.5, 639.6], r: 0.3, kind: 'pot', color: '#b8483a', colors: ['#d8485e'] }, // P19L
  // ===== Belchenstraße =====
  { street: 'Belchenstraße', t: 'hedge', pts: [[89.5, -161.2], [96, -157.8], [104, -153.6], [106.8, -152.2]], h: 0.5, w: 0.5, kind: 'boxwood', color: '#4f7a35' }, // P03R+Luftbild
  { street: 'Belchenstraße', t: 'hedge', pts: [[90.5, -162.6], [96, -159.6], [98, -158.6]], h: 2, w: 1.5, kind: 'mixed', color: '#4a6e30' }, // P03R+P04R+Luftbild
  { street: 'Belchenstraße', t: 'hedge', pts: [[90.2, -171], [89.7, -162.8]], h: 3.5, w: 1.6, kind: 'thuja' }, // P04R+Luftbild
  { street: 'Belchenstraße', t: 'shrub', p: [88.6, -160.8], r: 0.8, h: 1, kind: 'boxwood' }, // P04R
  { street: 'Belchenstraße', t: 'wall', pts: [[97.8, -158.5], [98.6, -156.8], [100.2, -156], [101.8, -156.2]], h: 0.8, w: 0.4, mat: 'limestone', color: '#c9c2b0', cap: false }, // P03R+Luftbild
  { street: 'Belchenstraße', t: 'shrub', p: [102.5, -155.8], r: 1.2, h: 0.8, kind: 'conifer', color: '#4a6e3a' }, // P03R
  { street: 'Belchenstraße', t: 'shrub', p: [105.8, -154.6], r: 1, h: 1.8, kind: 'green', color: '#6e3a44' }, // P03R
  { street: 'Belchenstraße', t: 'shrub', p: [108.6, -153.3], r: 0.9, h: 1.3, kind: 'green', color: '#8ea83a' }, // P03R
  { street: 'Belchenstraße', t: 'wall', pts: [[78.5, -156.8], [85.8, -153.4]], h: 0.5, w: 0.4, mat: 'stone', color: '#8f8a7e', cap: false }, // P04L
  { street: 'Belchenstraße', t: 'fence', pts: [[80, -155.8], [85.8, -152.9]], h: 1.6, style: 'privacy', color: '#6b4a32' }, // P03L+P04L
  { street: 'Belchenstraße', t: 'hedge', pts: [[57.6, -176.9], [61, -174.5], [66, -172.3]], h: 2.2, w: 2.5, kind: 'wild' }, // P05R+Luftbild
  { street: 'Belchenstraße', t: 'wall', pts: [[42.5, -182.6], [45.5, -180.9], [49.5, -180.2]], h: 0.6, w: 0.6, mat: 'stone', color: '#a39a8a', cap: false }, // P06R+Luftbild
  { street: 'Belchenstraße', t: 'flowers', pts: [[43, -182.6], [46, -181.2], [49.2, -180.8]], h: 0.3, w: 0.8, colors: ['#f2d43a', '#e8c020', '#f4f0d0'] }, // P06R
  { street: 'Belchenstraße', t: 'shrub', p: [46.4, -181.6], r: 2.5, h: 3.2, kind: 'green', color: '#8b1a2a' }, // P06R+Luftbild (Fächerahorn)
  { street: 'Belchenstraße', t: 'shrub', p: [49.4, -184.2], r: 0.7, h: 1.6, kind: 'conifer', color: '#3f6a35' }, // P06R
  { street: 'Belchenstraße', t: 'shrub', p: [51.6, -184.4], r: 0.9, h: 2, kind: 'flowering', flower: '#f4f2ea' }, // P06R+Luftbild
  { street: 'Belchenstraße', t: 'fence', pts: [[25.5, -191.4], [31, -189], [36.5, -186.6]], h: 1, style: 'wire', color: '#6d6d5f' }, // P07R+P02L+Luftbild
  { street: 'Belchenstraße', t: 'fence', pts: [[36.5, -186.6], [37, -193.5]], h: 1, style: 'wire', color: '#6d6d5f' }, // P07R+Luftbild
  { street: 'Belchenstraße', t: 'shrub', p: [26, -190.4], r: 1.5, h: 2, kind: 'green', color: '#5a8a3a' }, // P07R+P02L+Luftbild
  { street: 'Belchenstraße', t: 'wall', pts: [[12.4, -189], [15.7, -187.6], [21.6, -184.7]], h: 0.9, w: 0.3, mat: 'concrete', color: '#b9b3a6' }, // P02L+P07L+Luftbild
  { street: 'Belchenstraße', t: 'hedge', pts: [[14, -187.7], [17.9, -186.2], [21.3, -184.5]], h: 1.8, w: 1, kind: 'mixed', color: '#4b6d2e' }, // P02L+P07L+Luftbild
  { street: 'Belchenstraße', t: 'shrub', p: [16.4, -186.9], r: 0.8, h: 1.7, kind: 'green', color: '#4a2e44' }, // P02L
  { street: 'Belchenstraße', t: 'flowers', pts: [[9, -190.3], [12.6, -188.9]], h: 0.4, w: 0.7, colors: ['#8f9a86', '#e6cf3a'] }, // P02R
  { street: 'Belchenstraße', t: 'planter', p: [13.1, -188.6], kind: 'pot', color: '#2e3a2e', colors: ['#5a7a3a'] }, // P02R
  { street: 'Belchenstraße', t: 'wall', pts: [[7.4, -190.9], [9.4, -190.2]], h: 0.6, w: 0.3, mat: 'concrete', color: '#bdb8ae' }, // P02R
  { street: 'Belchenstraße', t: 'shrub', p: [2.3, -191.7], r: 1.5, h: 3.5, kind: 'green', color: '#5a8a3a' }, // P02R+Luftbild
  { street: 'Belchenstraße', t: 'hedge', pts: [[14.2, -197], [14.4, -206]], h: 2, w: 2, kind: 'mixed' }, // Luftbild (Stichweg, kein Bild)
  { street: 'Belchenstraße', t: 'shrub', p: [-5.7, -194.9], r: 1, h: 2.5, kind: 'flowering', color: '#5a7a3a', flower: '#f4f0e0' }, // P09L
  { street: 'Belchenstraße', t: 'planter', p: [-8.7, -196.4], r: 0.5, kind: 'trough', color: '#5a3e2a', colors: ['#a9a6c2'], rot: -0.3 }, // P09L
  { street: 'Belchenstraße', t: 'hedge', pts: [[-9, -204.2], [-3, -203]], h: 1.8, w: 1.5, kind: 'wild' }, // P09R+Luftbild
  { street: 'Belchenstraße', t: 'wall', pts: [[-2.3, -202.6], [3, -201], [8, -199.4]], h: 0.3, w: 0.3, mat: 'concrete', color: '#d8d6cf' }, // P09R+Luftbild
  { street: 'Belchenstraße', t: 'fence', pts: [[-2.3, -202.7], [3, -201.1], [8, -199.5]], h: 1.1, style: 'metal', color: '#3f7a5a' }, // P09R
  { street: 'Belchenstraße', t: 'shrub', p: [-1, -203.6], r: 1, h: 1.3, kind: 'flowering', flower: '#f6f6f0' }, // P09R
  { street: 'Belchenstraße', t: 'wall', pts: [[-38.2, -200.5], [-39.4, -197.5], [-40.2, -194]], h: 1, w: 0.3, mat: 'concrete', color: '#9e9a90', fence: 'wire', fenceH: 1 }, // P11L+Luftbild
  { street: 'Belchenstraße', t: 'hedge', pts: [[-37.3, -200.2], [-38.3, -197], [-39, -194.2]], h: 2.5, w: 1.5, kind: 'wild' }, // P11L+Luftbild
  { street: 'Belchenstraße', t: 'shrub', p: [-42.2, -199], r: 1.2, h: 3, kind: 'green', color: '#7a9a40' }, // P11L
  { street: 'Belchenstraße', t: 'wall', pts: [[-45, -207.8], [-39.5, -207.6]], h: 1.1, w: 0.3, mat: 'concrete', color: '#a9a69c', fence: 'wire', fenceH: 0.9 }, // P11R+Luftbild
  { street: 'Belchenstraße', t: 'flowers', pts: [[-44.5, -208.8], [-40.2, -208.6]], h: 0.5, w: 1.2, colors: ['#f4f4f4', '#e8a0c8', '#d8d0f0'] }, // P11R
  { street: 'Belchenstraße', t: 'shrub', p: [-39.9, -209.6], r: 1, h: 2.2, kind: 'green', color: '#5a8a3a' }, // P11R
  { street: 'Belchenstraße', t: 'wall', pts: [[-39.6, -208.4], [-39.8, -216]], h: 0.3, w: 0.3, mat: 'concrete', color: '#c4c0b6', fence: 'metal', fenceH: 1 }, // P10R+Luftbild
  { street: 'Belchenstraße', t: 'hedge', pts: [[-40.3, -208.6], [-40.5, -216]], h: 1.3, w: 0.8, kind: 'mixed' }, // P10R+Luftbild
  { street: 'Belchenstraße', t: 'wall', pts: [[-61.6, -196.2], [-58.6, -196.7], [-58.7, -196.7], [-61.7, -196.2], [-61.6, -196.2]], h: 0.5, w: 0.3, mat: 'granite', color: '#b8b8b4' }, // P12L
  { street: 'Belchenstraße', t: 'wall', pts: [[-64, -203], [-60.5, -203.5]], h: 0.5, w: 0.3, mat: 'granite', color: '#a8a8a4' }, // P12R
  { street: 'Belchenstraße', t: 'shrub', p: [-62, -204], r: 0.9, h: 1.4, kind: 'green', color: '#4a7a35' }, // P12R
  { street: 'Belchenstraße', t: 'hedge', pts: [[-88.8, -191.7], [-83, -192.6]], h: 0.9, w: 0.7, kind: 'privet', color: '#4a6e2e' }, // P13L+Luftbild
  { street: 'Belchenstraße', t: 'fence', pts: [[-89, -191.9], [-83.1, -192.8]], h: 0.8, style: 'wire' }, // P13L
  { street: 'Belchenstraße', t: 'shrub', p: [-84.6, -202.6], r: 1.6, h: 3.5, kind: 'flowering', color: '#4a7035', flower: '#b8a0d8' }, // P13R+Luftbild (Flieder)
  { street: 'Belchenstraße', t: 'shrub', p: [-88.5, -201.6], r: 0.9, h: 1.5, kind: 'green', color: '#5a3a3a' }, // P13R
  { street: 'Belchenstraße', t: 'shrub', p: [-91.5, -201.2], r: 0.7, h: 3, kind: 'conifer', color: '#8a9a3a' }, // P13R
  { street: 'Belchenstraße', t: 'hedge', pts: [[-101.2, -188.6], [-105.6, -187.6], [-110.4, -186.3], [-114.5, -185.2]], h: 2.2, w: 1.5, kind: 'privet', color: '#3e5f2a' }, // P14L+Luftbild
  { street: 'Belchenstraße', t: 'shrub', p: [-102.8, -187.9], r: 1.5, h: 3, kind: 'green', color: '#6a7a3a' }, // P14L
  { street: 'Belchenstraße', t: 'shrub', p: [-129.5, -193.2], r: 0.7, h: 1.3, kind: 'green' }, // P15R+Luftbild
  { street: 'Belchenstraße', t: 'shrub', p: [-125.8, -192.8], r: 0.8, h: 1, kind: 'green', color: '#3f6a2f' }, // P15R
  // ===== Bergstraße =====
  { street: 'Bergstraße', t: 'hedge', pts: [[-1384.7, 876], [-1386.8, 885], [-1389.2, 895], [-1391.9, 903], [-1394, 911]], h: 3, w: 2, kind: 'conifer' }, // P00L+Luftbild
  { street: 'Bergstraße', t: 'hedge', pts: [[-1395, 913], [-1397.9, 925]], h: 1, w: 0.6, kind: 'mixed' }, // Luftbild
  { street: 'Bergstraße', t: 'shrub', p: [-1395.9, 921], r: 1.2, h: 3, kind: 'green', color: '#7a3a2a' }, // Luftbild
  { street: 'Bergstraße', t: 'hedge', pts: [[-1401.9, 913], [-1404.9, 925]], h: 1.2, w: 0.8, kind: 'mixed' }, // Luftbild
  { street: 'Bergstraße', t: 'hedge', pts: [[-1392.6, 873.5], [-1393.2, 876.5]], h: 0.9, w: 0.8, kind: 'privet' }, // P00R+Luftbild
  { street: 'Bergstraße', t: 'shrub', p: [-1394.9, 878], r: 1, h: 2, kind: 'green' }, // P00R+Luftbild
  { street: 'Bergstraße', t: 'hedge', pts: [[-1399, 885.5], [-1395.8, 888.3]], h: 1.2, w: 1, kind: 'mixed' }, // P00R+Luftbild
  // ===== Birkenhof =====
  // ===== Blansinger Straße =====
  { street: 'Blansinger Straße', t: 'wall', pts: [[-1405.8, 723], [-1407.3, 730.9]], h: 0.5, w: 0.4, mat: 'stone', color: '#8f8a80', capColor: '#aaa69d', fence: 'wire', fenceH: 1.2 }, // P21L+Luftbild
  { street: 'Blansinger Straße', t: 'wall', pts: [[-1417.4, 777.6], [-1418.2, 781.1]], h: 0.4, w: 0.3, mat: 'stone', color: '#9a948a', fence: 'rustic', fenceH: 0.9 }, // P01L
  { street: 'Blansinger Straße', t: 'shrub', p: [-1418, 781.9], r: 0.5, h: 0.6, kind: 'green' }, // P01L
  { street: 'Blansinger Straße', t: 'wall', pts: [[-1419.4, 799.6], [-1422, 802.5], [-1424.2, 805.5]], h: 1.2, w: 0.3, mat: 'plaster', color: '#e4e1da', capColor: '#8d8a84', fence: 'wood', fenceH: 1 }, // P02L+Luftbild
  { street: 'Blansinger Straße', t: 'shrub', p: [-1425, 823.5], r: 1.6, h: 4, kind: 'green', color: '#5b2333' }, // P03L+Luftbild
  { street: 'Blansinger Straße', t: 'hedge', pts: [[-1426.6, 814.7], [-1429, 823.3]], h: 0.5, w: 1.5, kind: 'mixed', color: '#3e5a2c' }, // P03L
  { street: 'Blansinger Straße', t: 'shrub', p: [-1436.2, 818.8], r: 0.5, h: 1, kind: 'green' }, // P03R
  { street: 'Blansinger Straße', t: 'shrub', p: [-1436.4, 820.5], r: 0.6, h: 0.9, kind: 'green' }, // P03R
  { street: 'Blansinger Straße', t: 'shrub', p: [-1436.6, 822.3], r: 0.5, h: 0.8, kind: 'flowering', flower: '#c9a0c8' }, // P03R
  { street: 'Blansinger Straße', t: 'wall', pts: [[-1437.1, 825.3], [-1438.6, 831.3]], h: 1.6, w: 0.3, mat: 'plaster', color: '#ecebe6' }, // P03R+Luftbild
  { street: 'Blansinger Straße', t: 'wall', pts: [[-1432.3, 842.1], [-1432.8, 848.3]], h: 0.8, w: 0.3, mat: 'concrete', color: '#a9a69e', cap: false }, // P04L
  { street: 'Blansinger Straße', t: 'hedge', pts: [[-1439, 832.6], [-1441.5, 841.4]], h: 1.5, w: 1, kind: 'thuja', color: '#3d5a2e' }, // P04R
  { street: 'Blansinger Straße', t: 'fence', pts: [[-1441.8, 842.5], [-1443.7, 849.2], [-1445.6, 856]], h: 1.2, style: 'wire', color: '#8e9088' }, // P04R+P05R
  { street: 'Blansinger Straße', t: 'shrub', p: [-1446.1, 838.4], r: 1.5, h: 3.5, kind: 'flowering', flower: '#b0559c' }, // P04R
  { street: 'Blansinger Straße', t: 'wall', pts: [[-1433.5, 857], [-1437.5, 859], [-1440.5, 863], [-1441.2, 867.5], [-1442.4, 872]], h: 1.6, w: 0.6, mat: 'concrete', color: '#8a6a55', fence: 'panel', fenceH: 1 }, // P05L+Luftbild
  { street: 'Blansinger Straße', t: 'flowers', pts: [[-1433.8, 858], [-1437.2, 860], [-1439.8, 863.6], [-1440.8, 867.6], [-1441.9, 871.6]], h: 0.4, w: 1.4, colors: ['#8a5cc8', '#b28be0', '#f2f2f2', '#c050a0'] }, // P05L
  { street: 'Blansinger Straße', t: 'shrub', p: [-1441, 873.4], r: 1.2, h: 2.5, kind: 'green', color: '#9a1f2a' }, // P05L+P06L+Luftbild
  { street: 'Blansinger Straße', t: 'fence', pts: [[-1449.2, 857], [-1450, 862], [-1450.6, 867]], h: 1.2, style: 'wire', color: '#8e9088' }, // P05R
  { street: 'Blansinger Straße', t: 'hedge', pts: [[-1448.4, 862.5], [-1449.2, 867.5]], h: 0.6, w: 0.8, kind: 'mixed' }, // P05R
  { street: 'Blansinger Straße', t: 'wall', pts: [[-1446.9, 856.6], [-1447.2, 859.8]], h: 0.4, w: 0.3, mat: 'brick', color: '#9a5a40' }, // P05R
  { street: 'Blansinger Straße', t: 'planter', p: [-1447, 857], r: 0.4, kind: 'trough', color: '#8a5a3c', colors: ['#5d8a3c'], rot: 1.4 }, // P05R
  { street: 'Blansinger Straße', t: 'planter', p: [-1447.1, 857.9], r: 0.3, kind: 'pot', color: '#b8643c', colors: ['#d83a3a'] }, // P05R
  { street: 'Blansinger Straße', t: 'planter', p: [-1447.1, 858.7], r: 0.3, kind: 'pot', color: '#b8643c', colors: ['#d83a3a'] }, // P05R
  { street: 'Blansinger Straße', t: 'planter', p: [-1447.2, 859.5], r: 0.4, kind: 'trough', color: '#8a5a3c', colors: ['#d83a3a', '#5d8a3c'], rot: 1.4 }, // P05R
  { street: 'Blansinger Straße', t: 'shrub', p: [-1443.8, 887], r: 0.6, h: 0.8, kind: 'green', color: '#a8323c' }, // P06L
  { street: 'Blansinger Straße', t: 'shrub', p: [-1443.4, 886], r: 0.3, h: 1.2, kind: 'conifer' }, // P06L
  { street: 'Blansinger Straße', t: 'wall', pts: [[-1455, 884.5], [-1455.2, 888], [-1455.5, 891], [-1456, 893.4], [-1458, 893.8]], h: 0.5, w: 0.4, mat: 'granite', color: '#8f8d88' }, // P06R+P07R
  { street: 'Blansinger Straße', t: 'shrub', p: [-1456.7, 892.8], r: 0.4, h: 0.5, kind: 'boxwood' }, // P07R
  { street: 'Blansinger Straße', t: 'shrub', p: [-1456.5, 892], r: 0.4, h: 0.5, kind: 'boxwood' }, // P07R
  { street: 'Blansinger Straße', t: 'shrub', p: [-1455.9, 889.8], r: 0.7, h: 1, kind: 'green' }, // P07R
  { street: 'Blansinger Straße', t: 'shrub', p: [-1456.5, 887.8], r: 0.4, h: 0.6, kind: 'flowering', flower: '#c83040' }, // P07R
  { street: 'Blansinger Straße', t: 'shrub', p: [-1456.4, 885.8], r: 0.5, h: 0.8, kind: 'conifer' }, // P06R
  { street: 'Blansinger Straße', t: 'hedge', pts: [[-1446.4, 895], [-1449.3, 901.5]], h: 1.8, w: 1, kind: 'laurel', color: '#2d5a26' }, // P06L+P07L
  { street: 'Blansinger Straße', t: 'wall', pts: [[-1447.1, 894.7], [-1450, 901.3]], h: 0.4, w: 0.3, mat: 'concrete', color: '#bdbab2', cap: false }, // P07L
  { street: 'Blansinger Straße', t: 'hedge', pts: [[-1458.2, 896.5], [-1461.4, 904]], h: 3, w: 2.5, kind: 'wild' }, // P07R
  { street: 'Blansinger Straße', t: 'wall', pts: [[-1454.7, 912], [-1456, 916.3]], h: 0.7, w: 0.3, mat: 'concrete', color: '#e2e2dc', cap: false, fence: 'privacy', fenceH: 1.1 }, // P08L
  { street: 'Blansinger Straße', t: 'fence', pts: [[-1459, 901], [-1463, 910.6], [-1467.1, 920.3]], h: 1.2, style: 'panel', color: '#a6aaa8' }, // P08R+Luftbild
  { street: 'Blansinger Straße', t: 'hedge', pts: [[-1462, 926.5], [-1457, 927.5]], h: 1, w: 1.2, kind: 'mixed' }, // P08L+Luftbild
  { street: 'Blansinger Straße', t: 'wall', pts: [[-1458.7, 932], [-1462.4, 941.5], [-1466.5, 952]], h: 3.2, w: 0.6, mat: 'concrete', color: '#c9c0ad', cap: false, fence: 'wire', fenceH: 1.5 }, // P08L+P09L+Luftbild
  { street: 'Blansinger Straße', t: 'shrub', p: [-1472.5, 931], r: 1.5, h: 3.5, kind: 'flowering', flower: '#f2eef2' }, // P09R
  { street: 'Blansinger Straße', t: 'hedge', pts: [[-1478.3, 935.5], [-1479.6, 943]], h: 0.8, w: 0.8, kind: 'privet' }, // P09R+Luftbild
  { street: 'Blansinger Straße', t: 'shrub', p: [-1477.4, 938.4], r: 0.4, h: 0.6, kind: 'rose', flower: '#c02838' }, // P09R
  { street: 'Blansinger Straße', t: 'shrub', p: [-1477.7, 940], r: 0.4, h: 0.6, kind: 'rose', flower: '#c02838' }, // P09R
  { street: 'Blansinger Straße', t: 'hedge', pts: [[-1434.3, 1026], [-1425.7, 1030], [-1417.2, 1034.1], [-1408.7, 1038.3]], h: 3.5, w: 4, kind: 'wild' }, // P17L+P18L+Luftbild
  { street: 'Blansinger Straße', t: 'fence', pts: [[-1358.3, 1058.8], [-1348, 1063.7], [-1337.8, 1068.6], [-1327.6, 1073.4], [-1317.3, 1078.3], [-1307.1, 1083.2], [-1296.9, 1088.1]], h: 1.1, style: 'wire', color: '#8b8b84' }, // P00L
  // ===== Blauenstraße =====
  { street: 'Blauenstraße', t: 'hedge', pts: [[-1073.9, 824.1], [-1081.3, 824.8], [-1088.7, 825.4]], h: 1.5, w: 1, kind: 'mixed' }, // P06R+Luftbild
  { street: 'Blauenstraße', t: 'fence', pts: [[-1089.9, 826], [-1094.8, 826.4]], h: 0.9, style: 'metal', color: '#8c9094' }, // P07R
  { street: 'Blauenstraße', t: 'fence', pts: [[-1096.2, 826.5], [-1103.7, 827.2]], h: 0.9, style: 'metal', color: '#8c9094' }, // P07R
  { street: 'Blauenstraße', t: 'shrub', p: [-1093.4, 822.8], r: 1.5, h: 2.8, kind: 'green', color: '#8b1e2e' }, // P07R+Luftbild
  { street: 'Blauenstraße', t: 'shrub', p: [-1103.8, 825], r: 2, h: 3.8, kind: 'conifer', color: '#2f4a2a' }, // P07R+Luftbild
  { street: 'Blauenstraße', t: 'shrub', p: [-1099.8, 825.6], r: 1.1, h: 2.4, kind: 'flowering', flower: '#f3f1e6' }, // P07R
  { street: 'Blauenstraße', t: 'shrub', p: [-1093.8, 825.7], r: 0.5, h: 0.6, kind: 'green' }, // P07R
  { street: 'Blauenstraße', t: 'hedge', pts: [[-1104.9, 826.8], [-1111.4, 827.4]], h: 2.3, w: 1, kind: 'mixed', color: '#3d5a2c' }, // P08R
  { street: 'Blauenstraße', t: 'hedge', pts: [[-1121.9, 828.4], [-1131.4, 829.3]], h: 1.7, w: 1, kind: 'privet' }, // P08R+P09R+Luftbild
  { street: 'Blauenstraße', t: 'shrub', p: [-1136.5, 829.3], r: 1, h: 2, kind: 'green' }, // P09R
  { street: 'Blauenstraße', t: 'hedge', pts: [[-1144.7, 829.1], [-1144.5, 831.3], [-1153.2, 833.1], [-1162, 834.9]], h: 1.8, w: 1.2, kind: 'privet' }, // P10R+P09R+Luftbild
  { street: 'Blauenstraße', t: 'shrub', p: [-1165.9, 835], r: 1.5, h: 2.5, kind: 'green', color: '#5f7f3a' }, // P11R
  { street: 'Blauenstraße', t: 'hedge', pts: [[-1173.7, 838], [-1183.2, 840.5]], h: 1.2, w: 0.9, kind: 'mixed' }, // P11R+Luftbild
  { street: 'Blauenstraße', t: 'shrub', p: [-1184.8, 840.6], r: 0.8, h: 1, kind: 'green' }, // P12R
  { street: 'Blauenstraße', t: 'hedge', pts: [[-1196.1, 844.2], [-1197.1, 841.5]], h: 0.7, w: 0.6, kind: 'boxwood' }, // P12R
  { street: 'Blauenstraße', t: 'hedge', pts: [[-1205.7, 846.4], [-1214.4, 848.7], [-1223, 850.7]], h: 1.7, w: 1.1, kind: 'privet' }, // P13R+P12R+Luftbild
  { street: 'Blauenstraße', t: 'shrub', p: [-1228.7, 851], r: 1.8, h: 2.8, kind: 'green', color: '#5d8a3a' }, // P14R
  { street: 'Blauenstraße', t: 'hedge', pts: [[-1237, 853.7], [-1248, 856.2]], h: 2.3, w: 1.2, kind: 'laurel' }, // P15R+P14R
  { street: 'Blauenstraße', t: 'hedge', pts: [[-1248, 856.2], [-1258, 858.4]], h: 1.8, w: 1.1, kind: 'laurel' }, // P15R
  { street: 'Blauenstraße', t: 'shrub', p: [-1289.4, 863.1], r: 0.6, h: 0.9, kind: 'boxwood' }, // P17R+Luftbild
  { street: 'Blauenstraße', t: 'shrub', p: [-1281.3, 860.9], r: 1, h: 1.3, kind: 'green' }, // P17R+Luftbild
  { street: 'Blauenstraße', t: 'shrub', p: [-1278.6, 861], r: 0.9, h: 1.2, kind: 'green' }, // Luftbild
  { street: 'Blauenstraße', t: 'shrub', p: [-1285.2, 863.6], r: 0.4, h: 0.5, kind: 'grass', color: '#a8a070' }, // P17R
  { street: 'Blauenstraße', t: 'shrub', p: [-1291.8, 864.5], r: 0.4, h: 0.5, kind: 'grass', color: '#a8a070' }, // P17R
  { street: 'Blauenstraße', t: 'shrub', p: [-1295, 864.9], r: 0.4, h: 0.5, kind: 'grass', color: '#a8a070' }, // P17R
  { street: 'Blauenstraße', t: 'hedge', pts: [[-1349.8, 867], [-1353, 866.8]], h: 1, w: 0.7, kind: 'mixed' }, // P20R
  { street: 'Blauenstraße', t: 'shrub', p: [-1346.3, 866.6], r: 0.9, h: 1.6, kind: 'green' }, // P20R
  { street: 'Blauenstraße', t: 'planter', p: [-1350.8, 865.8], r: 0.4, kind: 'pot', color: '#b06a45', colors: ['#e86aa0'] }, // P20R
  { street: 'Blauenstraße', t: 'fence', pts: [[-1366.5, 866.6], [-1364.5, 866.6], [-1364.2, 864.7]], h: 1.7, style: 'privacy', color: '#4a4d50' }, // P21R
  { street: 'Blauenstraße', t: 'shrub', p: [-1361.8, 865.2], r: 1.6, h: 2.5, kind: 'green', color: '#7fae4a' }, // P21R+Luftbild
  { street: 'Blauenstraße', t: 'wall', pts: [[-1047.8, 830.4], [-1049.8, 830.6]], h: 1.2, w: 0.5, mat: 'gabion', cap: false }, // P05L
  { street: 'Blauenstraße', t: 'wall', pts: [[-1049.9, 830.5], [-1058.7, 831.3], [-1067.4, 832.1]], h: 0.8, w: 0.3, mat: 'concrete', color: '#d8cfbd' }, // P05L
  { street: 'Blauenstraße', t: 'wall', pts: [[-1053.1, 831.5], [-1055.8, 831.7]], h: 1.3, w: 0.5, mat: 'gabion', cap: false }, // P05L
  { street: 'Blauenstraße', t: 'hedge', pts: [[-1055.9, 831.7], [-1058.6, 832]], h: 1.5, w: 0.8, kind: 'privet' }, // P05L
  { street: 'Blauenstraße', t: 'shrub', p: [-1059.5, 832.3], r: 0.7, h: 1.3, kind: 'green' }, // P05L
  { street: 'Blauenstraße', t: 'flowers', pts: [[-1060.1, 832], [-1063.1, 832.3]], h: 0.4, w: 0.8, colors: ['#e8a0b4', '#f4f0f0'] }, // P05L
  { street: 'Blauenstraße', t: 'fence', pts: [[-1074, 831.8], [-1073.3, 839.9]], h: 1, style: 'wood', color: '#6b4a32' }, // P06L+Luftbild
  { street: 'Blauenstraße', t: 'shrub', p: [-1079.1, 833], r: 0.9, h: 1.2, kind: 'green' }, // P06L+Luftbild
  { street: 'Blauenstraße', t: 'wall', pts: [[-1114.1, 836.3], [-1118.4, 836.7]], h: 0.3, w: 0.2, mat: 'concrete', color: '#c8c3b8' }, // P08L
  { street: 'Blauenstraße', t: 'shrub', p: [-1115.3, 837.4], r: 0.8, h: 1, kind: 'green' }, // P08L
  { street: 'Blauenstraße', t: 'shrub', p: [-1117.5, 838.4], r: 0.5, h: 1.5, kind: 'conifer' }, // P08L
  { street: 'Blauenstraße', t: 'hedge', pts: [[-1122.8, 837.2], [-1124.6, 837.3]], h: 1.2, w: 0.8, kind: 'mixed' }, // P08L
  { street: 'Blauenstraße', t: 'hedge', pts: [[-1145.1, 847.2], [-1146.8, 840.8]], h: 1.8, w: 1, kind: 'privet' }, // P09L+P10L+Luftbild
  { street: 'Blauenstraße', t: 'fence', pts: [[-1144.4, 847.1], [-1146, 840.6]], h: 1.2, style: 'wire', color: '#6d7a5a' }, // P09L
  { street: 'Blauenstraße', t: 'wall', pts: [[-1147.3, 840.3], [-1158.3, 842.6]], h: 0.5, w: 0.3, mat: 'concrete', color: '#cfcac0' }, // P10L
  { street: 'Blauenstraße', t: 'hedge', pts: [[-1147.3, 841.1], [-1158.1, 843.4]], h: 1.9, w: 1, kind: 'privet' }, // P10L+Luftbild
  { street: 'Blauenstraße', t: 'shrub', p: [-1169.1, 847.8], r: 0.7, h: 0.6, kind: 'grass', color: '#9aa86a' }, // P11L
  { street: 'Blauenstraße', t: 'wall', pts: [[-1171.6, 845.9], [-1177.6, 847.5], [-1183.6, 849.1], [-1189.6, 850.7], [-1195.6, 852.2]], h: 1.1, w: 0.5, mat: 'stone', color: '#a89f8f' }, // P12L+Luftbild
  { street: 'Blauenstraße', t: 'hedge', pts: [[-1171.3, 847.2], [-1177.3, 848.8], [-1183.3, 850.3], [-1189.3, 851.9], [-1195.3, 853.5]], h: 3.4, w: 1.6, kind: 'conifer', color: '#3f5a2e' }, // P12L+P11L+Luftbild
  { street: 'Blauenstraße', t: 'wall', pts: [[-1198.5, 853.5], [-1207.2, 855.8], [-1216.1, 858.1]], h: 0.5, w: 0.2, mat: 'concrete', color: '#c9c4b8', fence: 'metal', fenceH: 0.9 }, // P13L
  { street: 'Blauenstraße', t: 'hedge', pts: [[-1200.2, 855.2], [-1202.6, 860]], h: 0.6, w: 0.5, kind: 'boxwood' }, // P13L
  { street: 'Blauenstraße', t: 'shrub', p: [-1224.6, 860.7], r: 0.6, h: 4, kind: 'conifer', color: '#3c5a30' }, // P14L
  { street: 'Blauenstraße', t: 'shrub', p: [-1226, 860.7], r: 0.5, h: 3.4, kind: 'conifer', color: '#3c5a30' }, // P14L+Luftbild
  { street: 'Blauenstraße', t: 'shrub', p: [-1227.3, 861], r: 0.5, h: 3.6, kind: 'conifer', color: '#3c5a30' }, // P14L+Luftbild
  { street: 'Blauenstraße', t: 'shrub', p: [-1228.6, 861.3], r: 0.5, h: 3.2, kind: 'conifer', color: '#3c5a30' }, // P14L+Luftbild
  { street: 'Blauenstraße', t: 'wall', pts: [[-1230.7, 861], [-1237.9, 862.6], [-1245, 864.2], [-1252.2, 865.8]], h: 0.6, w: 0.3, mat: 'concrete', color: '#dcd8cf' }, // P14L+P15L
  { street: 'Blauenstraße', t: 'hedge', pts: [[-1230.5, 861.7], [-1239, 863.6]], h: 1.3, w: 0.9, kind: 'laurel', color: '#2f4a28' }, // P14L
  { street: 'Blauenstraße', t: 'hedge', pts: [[-1239, 863.9], [-1244.5, 865.1]], h: 2.4, w: 1.5, kind: 'mixed' }, // P15L
  { street: 'Blauenstraße', t: 'hedge', pts: [[-1245.1, 864.6], [-1252.1, 866.2]], h: 0.9, w: 0.5, kind: 'ivy' }, // P15L
  { street: 'Blauenstraße', t: 'wall', pts: [[-1271.6, 868.8], [-1280.6, 870.1]], h: 1, w: 0.3, mat: 'plaster', color: '#9fd0bd' }, // P16L+Luftbild
  { street: 'Blauenstraße', t: 'hedge', pts: [[-1271.5, 869.4], [-1277.6, 870.3], [-1283.7, 871.1], [-1289.9, 872], [-1296, 872.8]], h: 2, w: 1.2, kind: 'mixed' }, // P16L+P17L+Luftbild
  { street: 'Blauenstraße', t: 'wall', pts: [[-1296.4, 873.3], [-1303.4, 874.3], [-1310.4, 875.2], [-1317.4, 876.2]], h: 1, w: 0.8, mat: 'limestone', color: '#b8b0a0', cap: false }, // P18L+P17L+Luftbild
  { street: 'Blauenstraße', t: 'flowers', pts: [[-1297.2, 874.8], [-1304.2, 875.8], [-1311.2, 876.8]], h: 0.4, w: 1.8, colors: ['#8a5cc0', '#e07ab0', '#f0d040', '#f4f4f4'] }, // P18L
  { street: 'Blauenstraße', t: 'shrub', p: [-1307.1, 877], r: 0.8, h: 0.9, kind: 'flowering', flower: '#d02030' }, // P18L
  { street: 'Blauenstraße', t: 'shrub', p: [-1317.8, 877.5], r: 0.8, h: 2.5, kind: 'conifer' }, // P19L
  { street: 'Blauenstraße', t: 'wall', pts: [[-1325.1, 876], [-1331.3, 875.8], [-1337.5, 875.6], [-1343.6, 875.4], [-1344.2, 881.2]], h: 0.4, w: 0.2, mat: 'concrete', color: '#cfcac2' }, // P19L+P20L
  { street: 'Blauenstraße', t: 'flowers', pts: [[-1326.2, 877], [-1334.2, 876.7], [-1342.2, 876.4]], h: 0.4, w: 1.4, colors: ['#f2d03a', '#f4f0d8'] }, // P19L
  { street: 'Blauenstraße', t: 'shrub', p: [-1328.2, 877.7], r: 0.7, h: 0.9, kind: 'grass', color: '#a2a46a' }, // P19L
  { street: 'Blauenstraße', t: 'shrub', p: [-1334.2, 878], r: 0.6, h: 0.8, kind: 'grass', color: '#a2a46a' }, // P19L
  { street: 'Blauenstraße', t: 'shrub', p: [-1342.3, 878.7], r: 0.7, h: 1, kind: 'green' }, // P20L
  { street: 'Blauenstraße', t: 'shrub', p: [-1354.2, 876.9], r: 1.2, h: 1.5, kind: 'green', color: '#7a1f2b' }, // P20L+Luftbild
  { street: 'Blauenstraße', t: 'shrub', p: [-1351.7, 877.5], r: 0.5, h: 1, kind: 'grass', color: '#6f8f5a' }, // P20L
  { street: 'Blauenstraße', t: 'wall', pts: [[-1351.9, 879.9], [-1351.9, 874.9], [-1356.6, 874.7]], h: 0.3, w: 0.2, mat: 'concrete', color: '#cfcac2' }, // P20L
  { street: 'Blauenstraße', t: 'wall', pts: [[-1357.1, 874.7], [-1364.4, 874.4], [-1371.6, 874.2]], h: 0.5, w: 0.2, mat: 'concrete', color: '#bdb8ad' }, // P21L
  { street: 'Blauenstraße', t: 'flowers', pts: [[-1362.2, 875.3], [-1370.2, 875]], h: 0.3, w: 1.2, colors: ['#f6f6f6'] }, // P21L
  { street: 'Blauenstraße', t: 'shrub', p: [-1367.2, 876.8], r: 1, h: 1.5, kind: 'flowering', flower: '#f2d22a' }, // P21L
  { street: 'Blauenstraße', t: 'shrub', p: [-1360.7, 876.8], r: 0.8, h: 1, kind: 'green' }, // P21L
  { street: 'Blauenstraße', t: 'shrub', p: [-1363.7, 876.9], r: 0.8, h: 1, kind: 'green' }, // P21L
  { street: 'Blauenstraße', t: 'wall', pts: [[-1372.6, 874.1], [-1384.3, 873.5], [-1386.3, 880]], h: 0.5, w: 0.2, mat: 'concrete', color: '#c4bfb4' }, // P22L
  { street: 'Blauenstraße', t: 'shrub', p: [-1405.9, 868.9], r: 0.9, h: 1.2, kind: 'flowering', flower: '#f6f6f6' }, // P23L
  { street: 'Blauenstraße', t: 'shrub', p: [-1407.3, 868], r: 0.5, h: 0.7, kind: 'boxwood' }, // P23L
  { street: 'Blauenstraße', t: 'shrub', p: [-1410.8, 868.9], r: 1.5, h: 3, kind: 'green', color: '#3e5a30' }, // P23L
  { street: 'Blauenstraße', t: 'wall', pts: [[-1411.5, 865.6], [-1413.4, 871.8]], h: 1, w: 0.3, mat: 'concrete', color: '#c9c4ba' }, // P23L
  { street: 'Blauenstraße', t: 'hedge', pts: [[-1416.5, 864.3], [-1418.4, 870.3]], h: 1.2, w: 0.8, kind: 'privet' }, // P23L
  { street: 'Blauenstraße', t: 'shrub', p: [-1417.7, 864.2], r: 0.4, h: 0.6, kind: 'boxwood' }, // P23L
  { street: 'Blauenstraße', t: 'fence', pts: [[-1420, 863.3], [-1426, 861.4], [-1432, 859.6], [-1438, 857.8]], h: 0.5, style: 'wood', color: '#7b5b3b' }, // P24L
  { street: 'Blauenstraße', t: 'flowers', pts: [[-1420.8, 863.9], [-1429.5, 861.2], [-1438.3, 858.5]], h: 0.3, w: 1.4, colors: ['#8466d0', '#a070d8', '#f4f4f4', '#e078b0'] }, // P24L
  { street: 'Blauenstraße', t: 'fence', pts: [[-1423.6, 864.1], [-1431.1, 861.8], [-1438.6, 859.5]], h: 1, style: 'panel', color: '#7d8288' }, // P24L
  { street: 'Blauenstraße', t: 'shrub', p: [-1428.9, 863.5], r: 0.5, h: 2.4, kind: 'conifer' }, // P24L
  { street: 'Blauenstraße', t: 'shrub', p: [-1431.9, 862.8], r: 0.5, h: 2.2, kind: 'conifer' }, // P24L
  // ===== Brückleweg =====
  { street: 'Brückleweg', t: 'fence', pts: [[-229.5, -92.2], [-221.8, -87.7]], h: 1, style: 'wire', color: '#4a6a3a' }, // P01R+Luftbild (Maschendraht an Holzpfosten)
  { street: 'Brückleweg', t: 'shrub', p: [-226.5, -89.8], r: 0.6, h: 0.9, kind: 'boxwood' }, // P01R
  { street: 'Brückleweg', t: 'shrub', p: [-224.8, -88.9], r: 0.6, h: 1, kind: 'boxwood' }, // P01R
  { street: 'Brückleweg', t: 'shrub', p: [-223.3, -88], r: 0.5, h: 0.8, kind: 'green' }, // P01R
  { street: 'Brückleweg', t: 'hedge', pts: [[-219.8, -86.6], [-213, -82.7]], h: 0.9, w: 0.6, kind: 'privet' }, // P01R+Luftbild
  { street: 'Brückleweg', t: 'hedge', pts: [[-211, -82.4], [-205.5, -79]], h: 0.8, w: 0.6, kind: 'privet' }, // P02R
  { street: 'Brückleweg', t: 'shrub', p: [-204.5, -78.5], r: 0.8, h: 0.9, kind: 'green', color: '#9ab478' }, // P02R
  { street: 'Brückleweg', t: 'wall', pts: [[-190.5, -72.6], [-180.5, -68.4]], h: 0.3, w: 0.3, mat: 'concrete', color: '#5a5a58', fence: 'panel', fenceH: 0.9 }, // P03R
  { street: 'Brückleweg', t: 'shrub', p: [-188.5, -70], r: 1, h: 1.6, kind: 'green' }, // P03R
  { street: 'Brückleweg', t: 'shrub', p: [-186.5, -69], r: 1.3, h: 2, kind: 'green' }, // P03R+Luftbild
  { street: 'Brückleweg', t: 'hedge', pts: [[-180, -67.4], [-175, -65.5]], h: 1.5, w: 1, kind: 'mixed' }, // P03R+Luftbild
  { street: 'Brückleweg', t: 'wall', pts: [[-175.4, -74.6], [-171.9, -73.2], [-158.9, -69.9], [-150.9, -67.9]], h: 0.4, w: 0.3, mat: 'concrete', color: '#b8b4ac' }, // P03L+P04L+Luftbild
  { street: 'Brückleweg', t: 'hedge', pts: [[-174.9, -75.7], [-171.6, -74.4], [-158.6, -71.1], [-151.1, -69.2]], h: 2.6, w: 2.5, kind: 'wild' }, // P03L+P04L+Luftbild (verwilderter Garten)
  { street: 'Brückleweg', t: 'hedge', pts: [[-150.4, -67.9], [-140.5, -65.3]], h: 1.6, w: 0.8, kind: 'privet' }, // P04L+Luftbild
  { street: 'Brückleweg', t: 'shrub', p: [-139.5, -65.5], r: 1, h: 2.5, kind: 'green', color: '#a8b040' }, // P05L
  { street: 'Brückleweg', t: 'hedge', pts: [[-172.5, -65.6], [-168, -64.5]], h: 0.5, w: 0.8, kind: 'mixed', color: '#2e4424' }, // P04R (Bodendecker)
  { street: 'Brückleweg', t: 'shrub', p: [-170.5, -63.5], r: 1.5, h: 3, kind: 'green' }, // P04R
  { street: 'Brückleweg', t: 'shrub', p: [-168.6, -64.2], r: 0.4, h: 0.9, kind: 'rose', flower: '#f4f4ee' }, // P04R
  { street: 'Brückleweg', t: 'hedge', pts: [[-163.5, -62.6], [-157, -61]], h: 0.7, w: 1, kind: 'mixed' }, // P04R+Luftbild
  { street: 'Brückleweg', t: 'wall', pts: [[-147, -59.2], [-140, -57.4], [-138.6, -56.2], [-138.9, -52]], h: 0.8, w: 0.5, mat: 'stone', color: '#8e8a80', fence: 'metal', fenceH: 0.8 }, // P05R+Luftbild
  { street: 'Brückleweg', t: 'shrub', p: [-142, -54.5], r: 2, h: 3.5, kind: 'green' }, // P05R+Luftbild
  // ===== Burgunderstraße =====
  { street: 'Burgunderstraße', t: 'hedge', pts: [[-1111.6, 543.4], [-1117.8, 548.4], [-1121.2, 551.2]], h: 3, w: 1.5, kind: 'thuja' }, // P01L+Luftbild
  { street: 'Burgunderstraße', t: 'hedge', pts: [[-1176, 593.5], [-1167, 590], [-1160, 587]], h: 1.5, w: 1, kind: 'mixed' }, // P05R+P27L+Luftbild
  { street: 'Burgunderstraße', t: 'hedge', pts: [[-1188.9, 588.6], [-1193.7, 592.6], [-1198.6, 596.5]], h: 1, w: 0.8, kind: 'privet' }, // P02R
  { street: 'Burgunderstraße', t: 'wall', pts: [[-1202.7, 598.6], [-1205.8, 601.2], [-1209, 603.8], [-1214.4, 608], [-1219.7, 612.3]], h: 0.5, w: 0.4, mat: 'stone', color: '#4f4a44', fence: 'privacy', fenceH: 1.3 }, // P02R+P03R
  { street: 'Burgunderstraße', t: 'wall', pts: [[-1219.7, 612.3], [-1224.8, 616.3], [-1225.3, 616.8]], h: 0.5, w: 0.4, mat: 'stone', color: '#4f4a44' }, // P03R+P21R
  { street: 'Burgunderstraße', t: 'hedge', pts: [[-1225.7, 617.1], [-1231.1, 621.5]], h: 1.6, w: 1.2, kind: 'mixed' }, // P21R+Luftbild
  { street: 'Burgunderstraße', t: 'hedge', pts: [[-1249.5, 635.8], [-1255, 640.1], [-1260.6, 644.4], [-1266.1, 648.6], [-1271.6, 652.9], [-1277.2, 657.2]], h: 1.6, w: 1, kind: 'privet' }, // P33R+P22R+P23R+Luftbild
  { street: 'Burgunderstraße', t: 'shrub', p: [-1266.3, 646.7], r: 1.2, h: 1.8, kind: 'flowering', flower: '#f4f4ee' }, // P23R
  { street: 'Burgunderstraße', t: 'wall', pts: [[-1277.4, 657.7], [-1282.3, 661.4], [-1285.5, 663.9], [-1288.7, 666.3], [-1292.2, 668.3]], h: 0.4, w: 0.3, mat: 'concrete', color: '#a8a49c', fence: 'metal', fenceH: 0.8 }, // P24R+P15R
  { street: 'Burgunderstraße', t: 'shrub', p: [-1285.2, 660.5], r: 0.8, h: 3, kind: 'conifer' }, // P24R
  { street: 'Burgunderstraße', t: 'fence', pts: [[-1300.5, 673], [-1306.4, 675.8], [-1312.2, 678.5], [-1318.1, 681.2]], h: 1.8, style: 'panel', color: '#3b3e42' }, // P15R+Luftbild
  { street: 'Burgunderstraße', t: 'fence', pts: [[-1440, 714.7], [-1441.8, 715.1], [-1444.4, 715.5]], h: 1.8, style: 'metal', color: '#9a9c9e' }, // P32R
  { street: 'Burgunderstraße', t: 'wall', pts: [[-1444.5, 715], [-1446.9, 715.5]], h: 1.6, w: 0.3, mat: 'plaster', color: '#e8e6e0', capColor: '#8a4a32' }, // P32R
  { street: 'Burgunderstraße', t: 'hedge', pts: [[-1487.2, 727.8], [-1490.6, 728.6]], h: 1, w: 0.8, kind: 'mixed' }, // P28R+P29R
  { street: 'Burgunderstraße', t: 'fence', pts: [[-1490.6, 728.6], [-1492.5, 729.1], [-1499.3, 731], [-1505.8, 732.9], [-1512.3, 734.7], [-1513.3, 735]], h: 1.8, style: 'panel', color: '#7d7468' }, // P28R+P29R+P08R
  { street: 'Burgunderstraße', t: 'wall', pts: [[-1513.3, 735], [-1519, 737], [-1524.8, 739], [-1530.5, 740.9], [-1531.7, 741.4]], h: 0.9, w: 0.3, mat: 'brick', color: '#5a2e26', capColor: '#d9c48a' }, // P08R+P09R
  { street: 'Burgunderstraße', t: 'shrub', p: [-1528.9, 738.8], r: 0.5, h: 1.1, kind: 'green', color: '#8a2f2a' }, // P09R
  { street: 'Burgunderstraße', t: 'shrub', p: [-1523.2, 736.8], r: 0.8, h: 1.2, kind: 'boxwood' }, // P09R
  { street: 'Burgunderstraße', t: 'fence', pts: [[-1541.8, 745.8], [-1547.3, 748.2]], h: 1.2, style: 'panel', color: '#6e8aa6' }, // P10R
  { street: 'Burgunderstraße', t: 'shrub', p: [-1546.7, 745.8], r: 1, h: 2, kind: 'green' }, // P10R
  { street: 'Burgunderstraße', t: 'fence', pts: [[-1547.3, 748.2], [-1552.5, 750.5], [-1557.6, 753.3], [-1562, 755.9]], h: 1, style: 'wood', color: '#6b4a33' }, // P10R+P11R
  { street: 'Burgunderstraße', t: 'wall', pts: [[-1573.6, 761.9], [-1575.2, 762.9], [-1581.4, 766.8], [-1587.4, 770.5]], h: 0.4, w: 0.3, mat: 'concrete', color: '#b0aca4' }, // P12R
  { street: 'Burgunderstraße', t: 'fence', pts: [[-1607.3, 789.2], [-1612.6, 794.3]], h: 1, style: 'panel', color: '#3e4247' }, // P14R
  { street: 'Burgunderstraße', t: 'fence', pts: [[-1175.5, 597.1], [-1181.4, 601.8], [-1187.2, 606.6], [-1193.1, 611.4], [-1198.9, 616.2], [-1204.8, 620.8], [-1210.6, 625.5]], h: 1, style: 'rustic', color: '#6b4a30' }, // P02L+P03L+P21L
  { street: 'Burgunderstraße', t: 'flowers', pts: [[-1216.5, 627.5], [-1209, 635]], h: 0.3, w: 1.6, colors: ['#f0c419', '#e8892b', '#f5e9a0'] }, // P21L+Luftbild
  { street: 'Burgunderstraße', t: 'fence', pts: [[-1227.4, 635.1], [-1230.6, 637.5], [-1233.8, 639.9]], h: 0.9, style: 'panel', color: '#5c6063' }, // P33L
  { street: 'Burgunderstraße', t: 'fence', pts: [[-1234.2, 640.2], [-1235.2, 641], [-1237.3, 642.6]], h: 1, style: 'picket', color: '#f2f2ee' }, // P33L
  { street: 'Burgunderstraße', t: 'wall', pts: [[-1237.7, 642.9], [-1243, 647], [-1248.4, 651.1]], h: 0.3, w: 0.3, mat: 'concrete', color: '#cfcac0', fence: 'white', fenceH: 0.7 }, // P33L+P22L
  { street: 'Burgunderstraße', t: 'shrub', p: [-1240.7, 647.2], r: 0.7, h: 1.2, kind: 'green' }, // P33L
  { street: 'Burgunderstraße', t: 'wall', pts: [[-1256.3, 657.2], [-1260.7, 660.6]], h: 0.5, w: 0.3, mat: 'granite', color: '#c8c8c4' }, // P23L+P22L
  { street: 'Burgunderstraße', t: 'shrub', p: [-1256.2, 658.2], r: 0.4, h: 1.5, kind: 'conifer' }, // P23L
  { street: 'Burgunderstraße', t: 'shrub', p: [-1257.2, 658.9], r: 0.4, h: 1.5, kind: 'conifer' }, // P23L
  { street: 'Burgunderstraße', t: 'shrub', p: [-1258.1, 659.7], r: 0.4, h: 1.5, kind: 'conifer' }, // P23L
  { street: 'Burgunderstraße', t: 'shrub', p: [-1259.1, 660.4], r: 0.4, h: 1.5, kind: 'conifer' }, // P23L
  { street: 'Burgunderstraße', t: 'shrub', p: [-1259.9, 661], r: 0.4, h: 1.5, kind: 'conifer' }, // P23L
  { street: 'Burgunderstraße', t: 'wall', pts: [[-1263.8, 663], [-1268.2, 666.4], [-1272.6, 669.8]], h: 1.6, w: 0.4, mat: 'gabion' }, // P23L+P24L
  { street: 'Burgunderstraße', t: 'wall', pts: [[-1275, 671.6], [-1277.8, 673.7]], h: 1, w: 0.3, mat: 'plaster', color: '#ecebe6' }, // P24L
  { street: 'Burgunderstraße', t: 'flowers', pts: [[-1479.5, 740.5], [-1483.6, 741.5], [-1488.4, 742.6]], h: 0.4, w: 0.8, colors: ['#d24a6e', '#f0f0f0', '#c03040'] }, // P28L+P29L
  { street: 'Burgunderstraße', t: 'flowers', pts: [[-1492.9, 745.4], [-1496.2, 746.3]], h: 0.4, w: 0.6, colors: ['#f4f4f0', '#9a8fb0', '#e07aa0'] }, // P08L
  { street: 'Burgunderstraße', t: 'shrub', p: [-1496.9, 745.9], r: 0.5, h: 2.5, kind: 'conifer' }, // P08L
  { street: 'Burgunderstraße', t: 'hedge', pts: [[-1497.6, 747.1], [-1503.8, 748.9]], h: 2, w: 0.6, kind: 'ivy' }, // P08L
  { street: 'Burgunderstraße', t: 'fence', pts: [[-1504.5, 745.2], [-1509, 746.5], [-1514.7, 748.4], [-1520.6, 750.4], [-1526.6, 752.5], [-1531.4, 754.6]], h: 1, style: 'rustic', color: '#5e4330' }, // P08L+P09L+P10L
  { street: 'Burgunderstraße', t: 'planter', p: [-1533.6, 755.9], r: 0.5, kind: 'trough', color: '#9a958c', colors: ['#6f9a4a'], rot: -2.7 }, // P10L
  { street: 'Burgunderstraße', t: 'planter', p: [-1534.6, 758.5], r: 0.5, kind: 'trough', color: '#9a958c', colors: ['#6f9a4a'], rot: -2.7 }, // P10L
  { street: 'Burgunderstraße', t: 'hedge', pts: [[-1538.2, 759], [-1542.7, 760.9], [-1547.1, 762.9], [-1551.9, 765.6]], h: 4.5, w: 3, kind: 'thuja', color: '#3f5a32' }, // P10L+P11L
  { street: 'Burgunderstraße', t: 'hedge', pts: [[-1555, 766.3], [-1561.9, 770.2], [-1568.8, 774.1], [-1571.6, 775.9]], h: 1.1, w: 0.9, kind: 'privet' }, // P11L+P12L
  { street: 'Burgunderstraße', t: 'shrub', p: [-1558.7, 771.8], r: 1.3, h: 3.5, kind: 'conifer' }, // P11L
  { street: 'Burgunderstraße', t: 'wall', pts: [[-1571, 779.7], [-1576.4, 783.1], [-1581.9, 786.6], [-1583.9, 788.8]], h: 0.6, w: 0.3, mat: 'concrete', color: '#a9a59d', fence: 'wire', fenceH: 0.7 }, // P12L+P13L
  { street: 'Burgunderstraße', t: 'shrub', p: [-1573.3, 783.5], r: 1.2, h: 2.2, kind: 'green' }, // P12L+P13L
  { street: 'Burgunderstraße', t: 'shrub', p: [-1576.7, 785.6], r: 1.2, h: 2.2, kind: 'green' }, // P12L+P13L
  { street: 'Burgunderstraße', t: 'shrub', p: [-1578.9, 786.8], r: 1.2, h: 2.2, kind: 'green' }, // P12L+P13L
  { street: 'Burgunderstraße', t: 'wall', pts: [[-1586.8, 788.8], [-1591.8, 793.7]], h: 0.5, w: 0.3, mat: 'concrete', color: '#a9a59d', fence: 'wire', fenceH: 0.6 }, // P14L
  { street: 'Burgunderstraße', t: 'shrub', p: [-1588.6, 792.7], r: 1.8, h: 3.5, kind: 'flowering', flower: '#f2efe6' }, // P14L
  { street: 'Burgunderstraße', t: 'fence', pts: [[-1595, 794.7], [-1597.9, 797.5]], h: 1, style: 'white', color: '#f0f0ec' }, // P14L
  { street: 'Burgunderstraße', t: 'hedge', pts: [[-1594.7, 797.9], [-1598.4, 801.5], [-1602.1, 805.1]], h: 2.5, w: 1.5, kind: 'mixed' }, // P14L
  // ===== Dürrenmatten =====
  { street: 'Dürrenmatten', t: 'fence', pts: [[-1278.2, 779.8], [-1278.3, 785.5]], h: 1.8, style: 'privacy', color: '#7a5434' }, // P00R
  { street: 'Dürrenmatten', t: 'shrub', p: [-1277.1, 782], r: 0.8, h: 1.1, kind: 'green' }, // P00R
  { street: 'Dürrenmatten', t: 'shrub', p: [-1277.3, 778.8], r: 1.2, h: 2, kind: 'green' }, // P00R
  { street: 'Dürrenmatten', t: 'shrub', p: [-1266.8, 791.5], r: 1.5, h: 3, kind: 'flowering', flower: '#b9a0d0' }, // P00L
  { street: 'Dürrenmatten', t: 'shrub', p: [-1265.2, 798], r: 0.7, h: 1, kind: 'flowering', flower: '#c03048' }, // P00L
  { street: 'Dürrenmatten', t: 'shrub', p: [-1267.2, 806.5], r: 0.4, h: 0.7, kind: 'green' }, // P01L
  { street: 'Dürrenmatten', t: 'shrub', p: [-1269.2, 805.3], r: 0.8, h: 1.3, kind: 'green', color: '#6e3a3e' }, // P01L+Luftbild
  { street: 'Dürrenmatten', t: 'wall', pts: [[-1279.8, 820.5], [-1283.5, 815.5]], h: 0.9, w: 0.3, mat: 'concrete', color: '#cfcbc3' }, // P01R
  { street: 'Dürrenmatten', t: 'shrub', p: [-1279.3, 822.3], r: 1.2, h: 2.5, kind: 'green' }, // P01R
  { street: 'Dürrenmatten', t: 'wall', pts: [[-1276.3, 826.2], [-1281, 825]], h: 0.7, w: 0.3, mat: 'concrete', color: '#b8b6b0' }, // P02R
  { street: 'Dürrenmatten', t: 'wall', pts: [[-1278.3, 829.5], [-1277.6, 837.5]], h: 0.4, w: 0.2, mat: 'concrete', color: '#c4c2bc', fence: 'panel', fenceH: 1 }, // P02R
  { street: 'Dürrenmatten', t: 'hedge', pts: [[-1261, 829.3], [-1268.9, 830.2], [-1268.5, 836.2], [-1266.9, 843.1]], h: 2.5, w: 1.2, kind: 'laurel' }, // P02L+P03L+Luftbild
  { street: 'Dürrenmatten', t: 'wall', pts: [[-1266.1, 848.7], [-1263.5, 856.7]], h: 1, w: 0.5, mat: 'stone', color: '#b0a593' }, // P03L
  { street: 'Dürrenmatten', t: 'hedge', pts: [[-1265.1, 848.5], [-1262.5, 856.3]], h: 2, w: 1, kind: 'mixed' }, // P03L
  { street: 'Dürrenmatten', t: 'fence', pts: [[-1266.2, 870.1], [-1264.7, 877], [-1263.3, 883.8], [-1261.2, 890.8]], h: 1, style: 'rustic', color: '#6e5034' }, // P04R+P05R
  { street: 'Dürrenmatten', t: 'shrub', p: [-1267.1, 873.5], r: 0.7, h: 4, kind: 'conifer', color: '#34502c' }, // P05R
  { street: 'Dürrenmatten', t: 'shrub', p: [-1266.7, 875.2], r: 0.7, h: 4, kind: 'conifer', color: '#34502c' }, // P05R
  { street: 'Dürrenmatten', t: 'shrub', p: [-1265.8, 876.9], r: 0.8, h: 1.3, kind: 'green' }, // P05R
  { street: 'Dürrenmatten', t: 'shrub', p: [-1267.1, 872.2], r: 1.1, h: 2.5, kind: 'green' }, // P05R
  { street: 'Dürrenmatten', t: 'shrub', p: [-1266.7, 885.8], r: 1.8, h: 3.8, kind: 'conifer', color: '#2c4426' }, // P05R
  { street: 'Dürrenmatten', t: 'hedge', pts: [[-1259.4, 867.6], [-1258.5, 871.9], [-1257.2, 878.2]], h: 2.8, w: 1.8, kind: 'mixed' }, // P05L+P04L
  { street: 'Dürrenmatten', t: 'shrub', p: [-1256.8, 875.5], r: 1.3, h: 3.2, kind: 'green', color: '#a8a83a' }, // P05L
  { street: 'Dürrenmatten', t: 'shrub', p: [-1257, 879.7], r: 0.9, h: 1.7, kind: 'boxwood' }, // P05L
  { street: 'Dürrenmatten', t: 'shrub', p: [-1256.6, 881.7], r: 0.9, h: 1.7, kind: 'boxwood' }, // P05L
  { street: 'Dürrenmatten', t: 'shrub', p: [-1256.4, 883.6], r: 0.9, h: 1.7, kind: 'boxwood' }, // P05L
  { street: 'Dürrenmatten', t: 'shrub', p: [-1253.6, 892.5], r: 0.5, h: 0.9, kind: 'boxwood' }, // P06L
  { street: 'Dürrenmatten', t: 'shrub', p: [-1254.1, 893.3], r: 0.3, h: 0.4, kind: 'grass', color: '#8ab0c0' }, // P06L
  { street: 'Dürrenmatten', t: 'shrub', p: [-1254.1, 891.5], r: 0.4, h: 0.6, kind: 'green', color: '#7a2030' }, // P06L
  { street: 'Dürrenmatten', t: 'shrub', p: [-1252.7, 896.5], r: 1.1, h: 2, kind: 'green', color: '#5c2838' }, // P06L
  { street: 'Dürrenmatten', t: 'shrub', p: [-1251.2, 897.7], r: 1.8, h: 3.5, kind: 'green' }, // P06L
  { street: 'Dürrenmatten', t: 'shrub', p: [-1251.2, 900.1], r: 0.8, h: 2.4, kind: 'conifer', color: '#c8b048' }, // P06L
  { street: 'Dürrenmatten', t: 'hedge', pts: [[-1251.4, 901.5], [-1250.2, 906]], h: 1.8, w: 1.2, kind: 'mixed' }, // P06L
  { street: 'Dürrenmatten', t: 'fence', pts: [[-1250.8, 906.7], [-1248.5, 914.3], [-1246.1, 921.9], [-1243.7, 929]], h: 1, style: 'panel', color: '#9a9ea2' }, // P07L+P08L+Luftbild
  { street: 'Dürrenmatten', t: 'fence', pts: [[-1261.5, 890.3], [-1259.9, 896.1]], h: 1, style: 'rustic', color: '#6a5a48' }, // P06R
  { street: 'Dürrenmatten', t: 'shrub', p: [-1262.2, 893.7], r: 1.2, h: 1.8, kind: 'green' }, // P06R
  { street: 'Dürrenmatten', t: 'hedge', pts: [[-1259.8, 896.8], [-1258.2, 902.8], [-1256.6, 908.8], [-1254.8, 914.9], [-1252.9, 920.9], [-1251, 926.9], [-1248.3, 933.6], [-1244.9, 939.6], [-1243.7, 943.7]], h: 1.4, w: 0.9, kind: 'privet', color: '#9bbf4a' }, // P06R+P07R+P08R+P09R+Luftbild
  // ===== Friedhofstraße =====
  { street: 'Friedhofstraße', t: 'wall', pts: [[-1135.4, 701], [-1130.7, 708.7]], h: 0.3, w: 0.3, mat: 'stone', color: '#8f877a', cap: false }, // P0R+Luftbild
  { street: 'Friedhofstraße', t: 'hedge', pts: [[-1136.6, 702.9], [-1133, 708.9]], h: 1.2, w: 3, kind: 'conifer', color: '#3f6b45' }, // P0R+Luftbild
  { street: 'Friedhofstraße', t: 'flowers', p: [-1132.5, 707.4], r: 0.8, h: 0.4, colors: ['#d8302a', '#f0d040', '#e86a8a'] }, // P0R
  { street: 'Friedhofstraße', t: 'shrub', p: [-1133.1, 709.6], r: 1, h: 2.5, kind: 'green' }, // P0R
  { street: 'Friedhofstraße', t: 'fence', pts: [[-1127.3, 702.6], [-1123.5, 709], [-1116.4, 717.5]], h: 1, style: 'picket', color: '#c4632f' }, // P0L+P1L
  { street: 'Friedhofstraße', t: 'fence', pts: [[-1116.4, 717.5], [-1115.2, 718.9]], h: 1.6, style: 'privacy', color: '#8a5a3a' }, // P1L
  { street: 'Friedhofstraße', t: 'shrub', p: [-1121.8, 709.6], r: 0.8, h: 1.6, kind: 'green' }, // P0L
  { street: 'Friedhofstraße', t: 'shrub', p: [-1120.4, 711.3], r: 0.7, h: 1.5, kind: 'green' }, // P0L
  { street: 'Friedhofstraße', t: 'shrub', p: [-1116.5, 713.7], r: 1.5, h: 2.5, kind: 'green' }, // P1L
  { street: 'Friedhofstraße', t: 'shrub', p: [-1113.4, 717], r: 1, h: 4, kind: 'conifer', color: '#a6b83a' }, // P1L
  { street: 'Friedhofstraße', t: 'shrub', p: [-1111.6, 717.2], r: 1, h: 3.5, kind: 'conifer' }, // P1L
  { street: 'Friedhofstraße', t: 'wall', pts: [[-1115.2, 726.7], [-1110.9, 729.3], [-1110.2, 729.7]], h: 1, w: 0.3, mat: 'concrete', color: '#a8a59e', cap: false }, // P1R
  { street: 'Friedhofstraße', t: 'hedge', pts: [[-1115.9, 727.9], [-1111.6, 730.5], [-1101, 735.8]], h: 2, w: 2.5, kind: 'wild', color: '#557a35' }, // P1R+P2R
  { street: 'Friedhofstraße', t: 'hedge', pts: [[-1108.7, 722.7], [-1107.7, 723.3], [-1096.5, 728.9]], h: 1.7, w: 1.2, kind: 'laurel' }, // P2L
  { street: 'Friedhofstraße', t: 'fence', pts: [[-1086.3, 733.7], [-1070, 739.8]], h: 1.8, style: 'privacy', color: '#4b4f55' }, // P3L+SteinP0R
  { street: 'Friedhofstraße', t: 'wall', pts: [[-1068.1, 737.5], [-1063.5, 743.1], [-1062.2, 745.2], [-1061.5, 745.9], [-1060.4, 748.6]], h: 1.4, w: 0.4, mat: 'plaster', color: '#ece8df', capColor: '#bdb6aa' }, // P4L+Luftbild
  { street: 'Friedhofstraße', t: 'wall', pts: [[-1059.1, 751.4], [-1054.5, 761.9]], h: 1.4, w: 0.4, mat: 'plaster', color: '#ece8df', capColor: '#bdb6aa' }, // P4L+P5L+Luftbild
  { street: 'Friedhofstraße', t: 'wall', pts: [[-1067.6, 751.3], [-1066.2, 754.5]], h: 0.4, w: 0.2, mat: 'concrete', color: '#e8e6e0', cap: false }, // P4R
  { street: 'Friedhofstraße', t: 'shrub', p: [-1067.6, 752.4], r: 0.4, h: 0.5, kind: 'green' }, // P4R
  { street: 'Friedhofstraße', t: 'shrub', p: [-1067.2, 753.6], r: 0.4, h: 0.5, kind: 'green' }, // P4R
  { street: 'Friedhofstraße', t: 'shrub', p: [-1060.2, 769.4], r: 0.5, h: 0.8, kind: 'green' }, // P5R
  { street: 'Friedhofstraße', t: 'shrub', p: [-1060, 770.3], r: 0.5, h: 0.8, kind: 'green' }, // P5R
  { street: 'Friedhofstraße', t: 'hedge', pts: [[-1049.8, 770.7], [-1046.5, 778.2], [-1044.8, 788.9]], h: 3.5, w: 2.5, kind: 'mixed', color: '#3f6a2e', flower: '#f5f5f0' }, // P6L+P5L
  { street: 'Friedhofstraße', t: 'fence', pts: [[-1045.6, 789.2], [-1045, 793]], h: 1.2, style: 'wood', color: '#8c8478' }, // P6L
  { street: 'Friedhofstraße', t: 'shrub', p: [-1044.2, 794.2], r: 0.7, h: 1.2, kind: 'green' }, // P6L
  { street: 'Friedhofstraße', t: 'shrub', p: [-1043.7, 796.7], r: 0.8, h: 1.3, kind: 'green' }, // P6L
  { street: 'Friedhofstraße', t: 'hedge', pts: [[-1044, 798.2], [-1042.1, 811.1]], h: 1.1, w: 0.9, kind: 'privet', color: '#7a9a45' }, // P7L
  { street: 'Friedhofstraße', t: 'hedge', pts: [[-1042, 811.1], [-1041.1, 817]], h: 2, w: 1.2, kind: 'mixed', color: '#4f7a34' }, // P7L
  { street: 'Friedhofstraße', t: 'shrub', p: [-1041.9, 802], r: 1.5, h: 4, kind: 'green', color: '#a8b860' }, // P7L
  { street: 'Friedhofstraße', t: 'flowers', p: [-1041.1, 803.4], r: 0.4, h: 0.5, colors: ['#c43040'] }, // P7L
  { street: 'Friedhofstraße', t: 'shrub', p: [-1041.1, 805.4], r: 1, h: 1.5, kind: 'flowering', flower: '#f4f2ea' }, // P7L
  { street: 'Friedhofstraße', t: 'shrub', p: [-1040.5, 807.3], r: 1, h: 2, kind: 'green' }, // P7L
  { street: 'Friedhofstraße', t: 'shrub', p: [-1039.9, 809.7], r: 1.5, h: 3.5, kind: 'flowering', flower: '#9a4fa8' }, // P7L+P6L
  { street: 'Friedhofstraße', t: 'wall', pts: [[-1053.7, 790.6], [-1051.6, 804.4]], h: 0.8, w: 0.3, mat: 'concrete', color: '#a9a59c', cap: false }, // P6R
  { street: 'Friedhofstraße', t: 'hedge', pts: [[-1054.1, 790.7], [-1052, 804.5]], h: 1.9, w: 0.8, kind: 'privet', color: '#4a6b30' }, // P6R
  { street: 'Friedhofstraße', t: 'fence', pts: [[-1051.7, 807], [-1051.3, 809.5]], h: 1, style: 'metal', color: '#f2f2f2' }, // P7R
  { street: 'Friedhofstraße', t: 'wall', pts: [[-1050.8, 809.9], [-1049.9, 815.3]], h: 0.4, w: 0.3, mat: 'concrete', color: '#cfcac0', cap: false }, // P7R
  { street: 'Friedhofstraße', t: 'shrub', p: [-1052, 811.6], r: 0.4, h: 0.8, kind: 'green', color: '#a03030' }, // P7R
  { street: 'Friedhofstraße', t: 'shrub', p: [-1051.2, 813.5], r: 0.4, h: 0.5, kind: 'green' }, // P7R
  { street: 'Friedhofstraße', t: 'shrub', p: [-1052.3, 812.8], r: 0.3, h: 0.5, kind: 'green' }, // P7R
  { street: 'Friedhofstraße', t: 'wall', pts: [[-1047.5, 828.7], [-1046.8, 831]], h: 1, w: 0.3, mat: 'concrete', color: '#b3afa6', cap: false }, // P8L+P8R+Luftbild
  { street: 'Friedhofstraße', t: 'hedge', pts: [[-1047.8, 828.7], [-1047.1, 831]], h: 2.1, w: 0.8, kind: 'privet', color: '#4f7a34' }, // P8L+P8R
  { street: 'Friedhofstraße', t: 'wall', pts: [[-1046.9, 831], [-1046.1, 833.9]], h: 1.8, w: 0.5, mat: 'gabion', cap: false }, // P8L+Luftbild
  // ===== Gutedelweg =====
  // ===== Huxmattenweg =====
  { street: 'Huxmattenweg', t: 'fence', pts: [[-1154.5, 658.4], [-1151.8, 659.6]], h: 1.3, style: 'metal', color: '#f0f0ec' }, // P00L+Bamlacher P22R
  { street: 'Huxmattenweg', t: 'fence', pts: [[-1149.9, 661.1], [-1143.8, 658.1]], h: 1.1, style: 'metal', color: '#f0f0ec' }, // P00L+Bamlacher P22R
  { street: 'Huxmattenweg', t: 'fence', pts: [[-1143.5, 658.1], [-1140.5, 656.7]], h: 1.1, style: 'privacy', color: '#4c4c4a' }, // P00L+Bamlacher P22R
  { street: 'Huxmattenweg', t: 'shrub', p: [-1143.6, 657.1], r: 0.3, h: 1.2, kind: 'conifer', color: '#3f6631' }, // P00L+Bamlacher P22R
  { street: 'Huxmattenweg', t: 'shrub', p: [-1142.8, 656.7], r: 0.3, h: 1.2, kind: 'conifer', color: '#3f6631' }, // P00L+Bamlacher P22R
  { street: 'Huxmattenweg', t: 'shrub', p: [-1142, 656.3], r: 0.3, h: 1.2, kind: 'conifer', color: '#3f6631' }, // P00L+Bamlacher P22R
  { street: 'Huxmattenweg', t: 'shrub', p: [-1141.2, 655.9], r: 0.3, h: 1.2, kind: 'conifer', color: '#3f6631' }, // P00L+Bamlacher P22R
  { street: 'Huxmattenweg', t: 'shrub', p: [-1149.4, 659.3], r: 0.9, h: 1.7, kind: 'green', color: '#5d7a3a' }, // P00L+Bamlacher P22R
  { street: 'Huxmattenweg', t: 'hedge', pts: [[-1131.6, 662.7], [-1122.4, 658.3], [-1112.3, 653.5], [-1103.8, 647.7], [-1095.3, 641.9], [-1086.8, 636.1], [-1078.4, 630.2], [-1070, 623.6], [-1061.9, 617.2], [-1053.9, 610.8], [-1045.8, 604.4], [-1037.8, 598], [-1029.7, 591], [-1022.1, 584], [-1014.7, 576.3], [-1007.8, 568.9], [-1000.6, 561.6], [-993.3, 554.4], [-985.9, 546.6], [-979.2, 538.9], [-972.4, 531.1]], h: 3, w: 3, kind: 'wild' }, // Bamlacher P22R+Luftbild
  { street: 'Huxmattenweg', t: 'shrub', p: [-1088.7, 622.5], r: 2, h: 3, kind: 'green' }, // Luftbild
  { street: 'Huxmattenweg', t: 'hedge', pts: [[-949.5, 438.5], [-946, 433.5], [-943.5, 430]], h: 1.8, w: 1.2, kind: 'mixed' }, // Luftbild
  // ===== Im Altstück =====
  { street: 'Im Altstück', t: 'shrub', p: [82.9, -287.3], r: 0.8, h: 1, kind: 'grass', color: '#a8a860' }, // P00R
  { street: 'Im Altstück', t: 'shrub', p: [82.9, -286.8], r: 0.7, h: 1, kind: 'grass', color: '#a8a860' }, // P00R
  { street: 'Im Altstück', t: 'shrub', p: [83, -286.1], r: 0.8, h: 1.2, kind: 'green' }, // P00R
  { street: 'Im Altstück', t: 'shrub', p: [86.8, -290.6], r: 0.5, h: 0.6, kind: 'green' }, // P00R
  { street: 'Im Altstück', t: 'hedge', pts: [[77.1, -293.1], [81.3, -299.7], [83.4, -303.1], [86.6, -308.1]], h: 0.9, w: 1, kind: 'mixed' }, // P00L+Luftbild
  { street: 'Im Altstück', t: 'hedge', pts: [[100.9, -335.1], [106.8, -327.1], [104.5, -323]], h: 2, w: 2, kind: 'mixed' }, // Luftbild
  { street: 'Im Altstück', t: 'hedge', pts: [[122.3, -372.2], [119.9, -365.2], [117.6, -358.2]], h: 2.2, w: 2, kind: 'mixed' }, // Luftbild
  { street: 'Im Altstück', t: 'hedge', pts: [[125.8, -382.5], [129, -380.5], [131.5, -378.8]], h: 2, w: 1.2, kind: 'mixed' }, // Luftbild
  { street: 'Im Altstück', t: 'wall', pts: [[132.2, -402.2], [137, -404.5], [141.4, -406.3]], h: 0.9, w: 0.3, mat: 'concrete', color: '#b8b6ae', cap: false }, // P06L+P06R+P07L+P08L+Luftbild
  { street: 'Im Altstück', t: 'hedge', pts: [[131.9, -402.8], [136.7, -405.1], [141.2, -407]], h: 2.8, w: 1.3, kind: 'mixed', color: '#4a6a32' }, // P06L+P07L+P08L
  { street: 'Im Altstück', t: 'shrub', p: [134.3, -402.7], r: 0.5, h: 0.9, kind: 'grass', color: '#8a9a60' }, // P06L+P07L
  { street: 'Im Altstück', t: 'shrub', p: [138.2, -404.6], r: 0.5, h: 0.9, kind: 'grass', color: '#8a9a60' }, // P06L+P07L
  { street: 'Im Altstück', t: 'shrub', p: [142.2, -406.9], r: 0.6, h: 3.6, kind: 'conifer', color: '#3a6030' }, // P06R+P07L+P08L
  { street: 'Im Altstück', t: 'shrub', p: [143, -407.2], r: 0.6, h: 3.8, kind: 'conifer', color: '#3a6030' }, // P07L
  { street: 'Im Altstück', t: 'shrub', p: [143.8, -407.4], r: 0.6, h: 3.4, kind: 'conifer', color: '#3a6030' }, // P07L
  { street: 'Im Altstück', t: 'fence', pts: [[144.4, -407.1], [145.8, -407.5]], h: 1, style: 'metal', color: '#8a8c8e' }, // P06R+P08L
  { street: 'Im Altstück', t: 'hedge', pts: [[157, -409.1], [163.3, -409.7]], h: 1.6, w: 1.2, kind: 'mixed' }, // Luftbild
  { street: 'Im Altstück', t: 'hedge', pts: [[158.5, -415.5], [158.5, -410.6]], h: 1.6, w: 1, kind: 'mixed' }, // Luftbild
  { street: 'Im Altstück', t: 'hedge', pts: [[158, -401.4], [163, -401.9], [167.9, -402.4]], h: 1.6, w: 1.5, kind: 'mixed' }, // P07R+Luftbild
  { street: 'Im Altstück', t: 'hedge', pts: [[180.2, -411.5], [181.5, -408.2], [185, -406.5]], h: 2.2, w: 1.5, kind: 'mixed', flower: '#e090b0' }, // P08R+Luftbild
  { street: 'Im Altstück', t: 'shrub', p: [182.5, -412.5], r: 0.8, h: 3.8, kind: 'conifer', color: '#3a6030' }, // P08R
  { street: 'Im Altstück', t: 'fence', pts: [[185, -406.5], [190, -403]], h: 1, style: 'wire', color: '#3c6a40' }, // P08R
  { street: 'Im Altstück', t: 'fence', pts: [[188.9, -392.8], [187.9, -388.2]], h: 1, style: 'wire', color: '#3c6a40' }, // P09L
  { street: 'Im Altstück', t: 'hedge', pts: [[190.5, -392.1], [189.3, -387.6]], h: 1.5, w: 2, kind: 'wild', flower: '#f0f0f0' }, // P09L
  { street: 'Im Altstück', t: 'flowers', pts: [[189.7, -391.7], [188.9, -388.9]], h: 0.7, w: 0.8, colors: ['#f0f0f0', '#e8a040', '#c8a0d8'] }, // P09L
  { street: 'Im Altstück', t: 'fence', pts: [[180.8, -390.1], [177.9, -383.7], [174.9, -377.2]], h: 1.2, style: 'privacy', color: '#7a5a3a' }, // P09R+Luftbild
  { street: 'Im Altstück', t: 'hedge', pts: [[175.5, -380], [173.4, -375.5]], h: 2, w: 1.8, kind: 'mixed' }, // P10R+Luftbild
  { street: 'Im Altstück', t: 'shrub', p: [168.6, -364.6], r: 1.5, h: 2, kind: 'green' }, // P10R+Luftbild
  { street: 'Im Altstück', t: 'shrub', p: [170.3, -368.2], r: 1.2, h: 2, kind: 'green' }, // P10R+Luftbild
  { street: 'Im Altstück', t: 'shrub', p: [182, -373.9], r: 1, h: 1.5, kind: 'green' }, // P10L
  { street: 'Im Altstück', t: 'wall', pts: [[173.9, -359.4], [170.2, -351.3]], h: 0.5, w: 0.2, mat: 'concrete', color: '#b8b6ae' }, // P11L+Luftbild
  { street: 'Im Altstück', t: 'flowers', pts: [[174.4, -358.6], [171, -351.4]], h: 1.6, w: 1, colors: ['#f0c020', '#e8a020', '#d06020'] }, // P11L+Luftbild
  { street: 'Im Altstück', t: 'shrub', p: [174.1, -356.6], r: 0.7, h: 1, kind: 'green', color: '#e07020' }, // P11L
  { street: 'Im Altstück', t: 'shrub', p: [172.8, -353.8], r: 0.6, h: 0.7, kind: 'green', color: '#c8a030' }, // P11L
  { street: 'Im Altstück', t: 'hedge', pts: [[167.2, -362.3], [164.7, -356.8], [162.2, -351.4]], h: 2.5, w: 2, kind: 'mixed' }, // P11R+Luftbild
  { street: 'Im Altstück', t: 'hedge', pts: [[155.9, -337], [152.3, -330]], h: 1.5, w: 1.5, kind: 'wild' }, // P12R+Luftbild
  { street: 'Im Altstück', t: 'shrub', p: [159, -322], r: 1.5, h: 2, kind: 'green' }, // P12L+Luftbild
  { street: 'Im Altstück', t: 'shrub', p: [160.5, -316.5], r: 1.5, h: 2, kind: 'green' }, // P12L+Luftbild
  { street: 'Im Altstück', t: 'shrub', p: [143, -320.5], r: 2, h: 2, kind: 'green' }, // P13R+Luftbild
  { street: 'Im Altstück', t: 'flowers', pts: [[160.2, -310.9], [163.5, -302.5]], h: 0.7, w: 1.5, colors: ['#8a6ac8', '#b8a0d8', '#d8d0e0'] }, // P13L
  { street: 'Im Altstück', t: 'hedge', pts: [[165.1, -300.3], [167.9, -293.7], [168.9, -285.4], [167.7, -279.8]], h: 3, w: 2.5, kind: 'wild' }, // Luftbild
  { street: 'Im Altstück', t: 'hedge', pts: [[146.1, -259.4], [143.6, -255]], h: 1, w: 0.8, kind: 'privet' }, // P16L+Luftbild
  { street: 'Im Altstück', t: 'shrub', p: [149.5, -266.1], r: 1.3, h: 1.8, kind: 'green' }, // P16R+Luftbild
  { street: 'Im Altstück', t: 'wall', pts: [[155, -273.3], [151.1, -266.7]], h: 0.9, w: 0.6, mat: 'limestone', color: '#cfc4a8', cap: false }, // P15L+P16R+Luftbild
  { street: 'Im Altstück', t: 'flowers', p: [151.9, -270.3], r: 1, h: 0.5, colors: ['#e8c830', '#a8b840'] }, // P15L+P16R
  { street: 'Im Altstück', t: 'shrub', p: [154.3, -251.5], r: 0.8, h: 1, kind: 'flowering', flower: '#d03040' }, // Luftbild
  // ===== Im Grund =====
  { street: 'Im Grund', t: 'hedge', pts: [[-285.2, -538.1], [-289.5, -534], [-293.7, -529.4], [-297.7, -524.9], [-301.7, -520.4], [-306.7, -514.9]], h: 2.6, w: 1.3, kind: 'mixed', color: '#33422c' }, // P01R+P02R+P03R+Luftbild
  { street: 'Im Grund', t: 'hedge', pts: [[-307.6, -503.3], [-311.6, -498.8], [-315.6, -494.3], [-319.6, -489.9], [-323.6, -485.4], [-328, -480.4]], h: 2.8, w: 1.3, kind: 'mixed', color: '#34402c' }, // P03R+P04R+P05R+Luftbild
  // ===== Im Kirschgarten =====
  { street: 'Im Kirschgarten', t: 'wall', pts: [[-245.8, 81.2], [-251.9, 78.3], [-253.9, 77.1]], h: 1.8, w: 0.3, mat: 'plaster', color: '#e6d9c3', capColor: '#b9b2a6' }, // P01L
  { street: 'Im Kirschgarten', t: 'wall', pts: [[-255.3, 76.4], [-262.9, 72.1]], h: 0.5, w: 0.3, mat: 'concrete', color: '#bdb8ad' }, // P01L
  { street: 'Im Kirschgarten', t: 'planter', p: [-257.8, 63.2], r: 1.2, kind: 'trough', color: '#a7a39b', colors: ['#d1495b', '#e2683c'], rot: -0.5 }, // P01R+Luftbild
  { street: 'Im Kirschgarten', t: 'shrub', p: [-257.8, 63.2], r: 0.5, h: 1.4, kind: 'grass', color: '#b8b27a' }, // P01R
  { street: 'Im Kirschgarten', t: 'shrub', p: [-269.3, 59.2], r: 0.4, h: 0.6, kind: 'green', color: '#8e2f2f' }, // P02R
  { street: 'Im Kirschgarten', t: 'shrub', p: [-267.3, 58.6], r: 0.5, h: 0.5, kind: 'green', color: '#4f7a32' }, // P02R
  { street: 'Im Kirschgarten', t: 'flowers', pts: [[-290.4, 48], [-289.1, 48.7], [-285, 50.9], [-282, 52.5], [-279.6, 54.3]], h: 0.5, w: 0.8, colors: ['#f2b51f', '#e8862a', '#c9c46a'] }, // P02R+P03R
  { street: 'Im Kirschgarten', t: 'hedge', pts: [[-314.6, 33.6], [-309.2, 34.2]], h: 1.5, w: 1, kind: 'laurel', color: '#2f5226' }, // P04R+Luftbild
  { street: 'Im Kirschgarten', t: 'shrub', p: [-342.3, 29.1], r: 1, h: 1.6, kind: 'flowering', color: '#3e5a2c', flower: '#c0392b' }, // P05R+Luftbild
  { street: 'Im Kirschgarten', t: 'shrub', p: [-338.4, 31.2], r: 1, h: 0.8, kind: 'green', color: '#7a3530' }, // P05R
  { street: 'Im Kirschgarten', t: 'shrub', p: [-335.5, 32.1], r: 1, h: 0.8, kind: 'green', color: '#8a3c34' }, // P05R
  { street: 'Im Kirschgarten', t: 'shrub', p: [-331.8, 32], r: 0.8, h: 1.5, kind: 'grass', color: '#9fa86a' }, // P05R+Luftbild
  { street: 'Im Kirschgarten', t: 'shrub', p: [-347, 27.5], r: 1.6, h: 2.5, kind: 'green', color: '#2e4a24' }, // P06R+Luftbild
  { street: 'Im Kirschgarten', t: 'flowers', pts: [[-357.2, 25.5], [-358.7, 25], [-361.7, 23], [-368.9, 18.5]], h: 0.5, w: 1, colors: ['#e0457b', '#f08a3c', '#f4f1ea', '#c8323c'] }, // P07R+Luftbild
  { street: 'Im Kirschgarten', t: 'shrub', p: [-360.8, 22.4], r: 0.4, h: 0.6, kind: 'boxwood', color: '#3f6a2a' }, // P07R
  { street: 'Im Kirschgarten', t: 'shrub', p: [-364.9, 19.9], r: 0.4, h: 0.6, kind: 'boxwood', color: '#3f6a2a' }, // P07R
  { street: 'Im Kirschgarten', t: 'shrub', p: [-362.7, 20.7], r: 0.7, h: 1.2, kind: 'green', color: '#456b2c' }, // P07R+Luftbild
  { street: 'Im Kirschgarten', t: 'shrub', p: [-365.2, 30.6], r: 2, h: 2.5, kind: 'green', color: '#2f4a28' }, // P07L+P07R+Luftbild
  { street: 'Im Kirschgarten', t: 'shrub', p: [-370.7, 16.4], r: 1.3, h: 1.2, kind: 'green', color: '#3f6a2a' }, // P08R+Luftbild
  { street: 'Im Kirschgarten', t: 'shrub', p: [-372.3, 13.6], r: 1.2, h: 1.2, kind: 'green', color: '#3f6a2a' }, // P08R+Luftbild
  { street: 'Im Kirschgarten', t: 'wall', pts: [[-391.8, -1.3], [-386.3, 3.6]], h: 1.8, w: 0.4, mat: 'gabion', color: '#a9a296', cap: false }, // P09R+Luftbild
  { street: 'Im Kirschgarten', t: 'wall', pts: [[-387.6, 5.1], [-385.4, 7.2], [-383.5, 8.3]], h: 0.6, w: 0.4, mat: 'limestone', color: '#c9bfa8', cap: false }, // P09R
  { street: 'Im Kirschgarten', t: 'shrub', p: [-394.6, -5.2], r: 1.8, h: 3, kind: 'green', color: '#2f4a25' }, // P09R
  // ===== Im Rebgärtle =====
  { street: 'Im Rebgärtle', t: 'fence', pts: [[-39.2, -223], [-39, -214.5]], h: 1.5, style: 'privacy', color: '#a07a4a' }, // P00L+Luftbild (Schilfmatte)
  { street: 'Im Rebgärtle', t: 'shrub', p: [-39.7, -219], r: 0.6, h: 0.6, kind: 'grass', color: '#7a9a50' }, // P00L
  { street: 'Im Rebgärtle', t: 'shrub', p: [-39.7, -216.4], r: 0.5, h: 0.5, kind: 'grass', color: '#7a9a50' }, // P00L
  { street: 'Im Rebgärtle', t: 'shrub', p: [-32.6, -223.5], r: 0.8, h: 2, kind: 'green', color: '#4a7a35' }, // P00R
  { street: 'Im Rebgärtle', t: 'shrub', p: [-32.1, -221.8], r: 0.6, h: 1, kind: 'conifer', color: '#3f6a2e' }, // P00R (Bergkiefer)
  { street: 'Im Rebgärtle', t: 'shrub', p: [-31.6, -220.9], r: 0.9, h: 1.4, kind: 'green' }, // P00R
  { street: 'Im Rebgärtle', t: 'planter', p: [-31.5, -219.9], kind: 'pot', color: '#b5643c', colors: ['#4a7a35'] }, // P00R
  { street: 'Im Rebgärtle', t: 'planter', p: [-31.1, -219.2], kind: 'pot', color: '#b5643c', colors: ['#5a8a3a'] }, // P00R
  { street: 'Im Rebgärtle', t: 'planter', p: [-29.8, -218.4], r: 0.5, kind: 'trough', color: '#6a4a2a', colors: ['#5a8a3a'], rot: -0.6 }, // P00R
  { street: 'Im Rebgärtle', t: 'shrub', p: [-29.2, -217.6], r: 1, h: 1.4, kind: 'green', color: '#4f7a35' }, // P00R+Luftbild
  { street: 'Im Rebgärtle', t: 'wall', pts: [[-44.7, -232.6], [-48, -233.8]], h: 0.5, w: 0.3, mat: 'concrete', color: '#d8d4cc' }, // P01L (Hochbeet)
  { street: 'Im Rebgärtle', t: 'shrub', p: [-45.3, -232.9], r: 0.8, h: 1.5, kind: 'rose', flower: '#f0c8d8' }, // P01L
  { street: 'Im Rebgärtle', t: 'planter', p: [-45.8, -233.9], kind: 'pot', color: '#b5643c', colors: ['#5a8a3a'] }, // P01L
  { street: 'Im Rebgärtle', t: 'fence', pts: [[-43.2, -243.5], [-42.4, -239.7], [-41, -237.9], [-37, -237.3], [-33, -237]], h: 0.6, style: 'wood', color: '#8a7a62' }, // P01R+Luftbild (Palisaden, Neuanlage 2024)
  { street: 'Im Rebgärtle', t: 'wall', pts: [[-48.2, -251], [-46.6, -253.2], [-44.1, -255.1], [-42, -257]], h: 1, w: 0.8, mat: 'limestone', color: '#d8cbb0', cap: false }, // P02R+Luftbild (große Betonblöcke)
  { street: 'Im Rebgärtle', t: 'fence', pts: [[-54.9, -254.9], [-47.3, -260.6], [-39, -268.6]], h: 1.2, style: 'wire', color: '#6d6d5f' }, // P02R+P08L+Luftbild
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[-53.5, -257], [-48, -261], [-44, -264.5]], h: 1.6, w: 1.2, kind: 'wild' }, // P08L+P02R
  { street: 'Im Rebgärtle', t: 'fence', pts: [[-55.6, -254.6], [-62.2, -252.1]], h: 1.2, style: 'wire', color: '#6d6d5f' }, // P02L
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[-56.5, -255.6], [-62.5, -253.2]], h: 2.2, w: 1.5, kind: 'wild' }, // P02L
  { street: 'Im Rebgärtle', t: 'wall', pts: [[-69.5, -241.4], [-75.1, -240.8], [-79.2, -238.9]], h: 0.4, w: 0.3, mat: 'concrete', color: '#b0aca2', fence: 'wire', fenceH: 1 }, // P04L+Luftbild
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[-76, -248.5], [-81, -250]], h: 2.2, w: 2, kind: 'wild' }, // P04R
  { street: 'Im Rebgärtle', t: 'wall', pts: [[-96.5, -229], [-99.2, -227.2], [-103, -224.1]], h: 1, w: 0.5, mat: 'stone', color: '#8a8070' }, // P05L+Luftbild
  { street: 'Im Rebgärtle', t: 'shrub', p: [-98.5, -226.8], r: 0.8, h: 1, kind: 'flowering', flower: '#e070a8' }, // P05L (Azalee)
  { street: 'Im Rebgärtle', t: 'shrub', p: [-103.8, -222.9], r: 1, h: 2, kind: 'green' }, // P05L+Luftbild
  { street: 'Im Rebgärtle', t: 'wall', pts: [[-101.6, -233.3], [-103.7, -231.7]], h: 1, w: 0.5, mat: 'gabion' }, // P05R
  { street: 'Im Rebgärtle', t: 'wall', pts: [[-108.5, -217.2], [-109.7, -211.9], [-110.6, -205]], h: 0.6, w: 0.3, mat: 'concrete', color: '#c8c4bc' }, // P06L+Luftbild (Formsteine)
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[-108, -217.2], [-109.3, -211.9], [-110, -205]], h: 2.8, w: 1.2, kind: 'laurel', color: '#3a6a2a' }, // P06L+Luftbild
  { street: 'Im Rebgärtle', t: 'shrub', p: [-115.9, -216.1], r: 1.2, h: 1.4, kind: 'green', color: '#4a7a35' }, // P06R+Luftbild
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[-114.8, -185.3], [-116, -182.9], [-117, -179.4], [-119.3, -176.1], [-120.5, -172.5]], h: 1.8, w: 1.2, kind: 'privet', color: '#3e5f2a' }, // P27L+Luftbild
  { street: 'Im Rebgärtle', t: 'shrub', p: [-123.8, -185.5], r: 0.8, h: 1.2, kind: 'green', color: '#7a9a5a' }, // P27L
  { street: 'Im Rebgärtle', t: 'planter', p: [-123.7, -185.7], r: 0.5, kind: 'pot', color: '#b5643c', colors: ['#3f6a2e'] }, // P07R (Brunnen)
  { street: 'Im Rebgärtle', t: 'wall', pts: [[-30.9, -269.5], [-29.5, -271.3]], h: 0.4, w: 0.3, mat: 'concrete', color: '#b8b4aa', fence: 'wire', fenceH: 0.9 }, // P09R
  { street: 'Im Rebgärtle', t: 'wall', pts: [[-28.7, -272.5], [-27.1, -274.8], [-25.3, -277.2]], h: 0.4, w: 0.3, mat: 'concrete', color: '#b8b4aa', fence: 'wire', fenceH: 0.9 }, // P09R+Luftbild
  { street: 'Im Rebgärtle', t: 'shrub', p: [-27.4, -274], r: 0.6, h: 0.8, kind: 'boxwood' }, // P09R
  { street: 'Im Rebgärtle', t: 'shrub', p: [-26.1, -275.6], r: 0.7, h: 1, kind: 'green' }, // P09R
  { street: 'Im Rebgärtle', t: 'shrub', p: [-25, -277.3], r: 0.6, h: 0.8, kind: 'green', color: '#557f3a' }, // P09R
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[-33.3, -265.5], [-28, -266.5]], h: 2, w: 1.2, kind: 'mixed' }, // P09R+Luftbild
  { street: 'Im Rebgärtle', t: 'planter', p: [-19.6, -284.2], kind: 'pot', color: '#b5643c', colors: ['#d83030', '#4a7a35'] }, // P10R
  { street: 'Im Rebgärtle', t: 'planter', p: [-19.2, -283.5], kind: 'pot', color: '#b5643c', colors: ['#e870a0'] }, // P10R
  { street: 'Im Rebgärtle', t: 'fence', pts: [[-11.1, -296.9], [-8, -301.1]], h: 1, style: 'wire', color: '#3a6a4a' }, // P11R+Luftbild
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[-10, -297.7], [-7.3, -301.4]], h: 1.2, w: 1, kind: 'mixed' }, // P11R+Luftbild
  { street: 'Im Rebgärtle', t: 'wall', pts: [[-8, -297.5], [-2, -298.5]], h: 1.2, w: 0.4, mat: 'sandstone', color: '#a87a6a' }, // P11R (roter Sandstein)
  { street: 'Im Rebgärtle', t: 'shrub', p: [-6.5, -301], r: 1.5, h: 2.8, kind: 'green', color: '#3f6a2e' }, // P11R+Luftbild
  { street: 'Im Rebgärtle', t: 'fence', pts: [[-0.6, -321.5], [3.3, -326.8]], h: 1.1, style: 'wire', color: '#6d6d5f' }, // P12L
  { street: 'Im Rebgärtle', t: 'shrub', p: [1.2, -325.4], r: 1.4, h: 2, kind: 'green', color: '#3a5a2a' }, // P12L (Zwergmispel)
  { street: 'Im Rebgärtle', t: 'wall', pts: [[3.7, -327.4], [7.4, -332.5], [10.4, -336.6]], h: 0.6, w: 0.3, mat: 'concrete', color: '#c8c4bc' }, // P12L+Luftbild
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[3.9, -328.3], [7.6, -333.4], [10.7, -337.5]], h: 1, w: 1, kind: 'mixed', flower: '#f4f4f0' }, // P12L
  { street: 'Im Rebgärtle', t: 'shrub', p: [9.5, -338], r: 1.5, h: 3, kind: 'green', color: '#5a2a30' }, // P13L+Luftbild (Blutpflaume)
  { street: 'Im Rebgärtle', t: 'shrub', p: [11.6, -340.2], r: 0.6, h: 2.5, kind: 'conifer', color: '#a8a838' }, // P13L (Gold-Thuja)
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[24.6, -346.1], [21.6, -341.8], [19.5, -338.7], [20.2, -337.2], [25.5, -333]], h: 0.9, w: 0.7, kind: 'privet', color: '#7a8a3a' }, // P13R+Luftbild
  { street: 'Im Rebgärtle', t: 'fence', pts: [[24.3, -346.2], [21.3, -341.9], [19.2, -338.8], [19.8, -336.8], [25.2, -332.6]], h: 0.6, style: 'metal', color: '#3a6a4a' }, // P13R
  { street: 'Im Rebgärtle', t: 'shrub', p: [22.4, -340.2], r: 0.8, h: 3, kind: 'conifer', color: '#2f5a2a' }, // P13R+Luftbild
  { street: 'Im Rebgärtle', t: 'shrub', p: [23.4, -339.4], r: 0.7, h: 2.6, kind: 'conifer', color: '#2f5a2a' }, // P13R
  { street: 'Im Rebgärtle', t: 'shrub', p: [21.6, -341.3], r: 0.9, h: 1.2, kind: 'green' }, // P13R
  { street: 'Im Rebgärtle', t: 'fence', pts: [[22.3, -353.6], [27, -360.5], [30.2, -365.5]], h: 1.2, style: 'wire', color: '#7a6a52' }, // P14L+Luftbild
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[22.7, -354.8], [25.8, -359.3]], h: 1, w: 1, kind: 'wild' }, // P14L
  { street: 'Im Rebgärtle', t: 'shrub', p: [18.8, -356.8], r: 1.2, h: 2, kind: 'green' }, // P14L+Luftbild
  { street: 'Im Rebgärtle', t: 'wall', pts: [[27.2, -348.8], [28.5, -352], [30.5, -354.8]], h: 0.6, w: 0.3, mat: 'plaster', color: '#ecebe6', capColor: '#9a9a9a' }, // P14R+Luftbild
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[29, -351], [30.5, -353.5]], h: 2.6, w: 1.6, kind: 'laurel' }, // P14R
  { street: 'Im Rebgärtle', t: 'shrub', p: [29.1, -352.2], r: 0.9, h: 1.5, kind: 'boxwood', color: '#557f35' }, // P14R
  { street: 'Im Rebgärtle', t: 'shrub', p: [30.2, -353.6], r: 1, h: 1.6, kind: 'green', color: '#4a7a30' }, // P14R
  { street: 'Im Rebgärtle', t: 'shrub', p: [31.1, -355.2], r: 0.8, h: 1.2, kind: 'boxwood' }, // P14R
  { street: 'Im Rebgärtle', t: 'fence', pts: [[31.1, -355.9], [33, -358.7]], h: 1, style: 'metal', color: '#b03040' }, // P14R (rote Zierpaneele)
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[29.2, -364.9], [32, -369], [35.5, -375], [38.4, -378.6]], h: 2.5, w: 1.8, kind: 'wild' }, // P15L+Luftbild
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[39.6, -380.2], [41, -383], [43.5, -388]], h: 2.5, w: 1.8, kind: 'wild' }, // P15L+P16L+Luftbild
  { street: 'Im Rebgärtle', t: 'wall', pts: [[41.6, -370.9], [44.8, -375.5], [47.8, -379.7]], h: 1.2, w: 0.3, mat: 'plaster', color: '#f0eee8', capColor: '#c0603a' }, // P15R+P25R (Ziegelabdeckung)
  { street: 'Im Rebgärtle', t: 'wall', pts: [[41.9, -371.3], [44.9, -375.6], [47.4, -379.1]], h: 0.3, w: 0.4, mat: 'stone', color: '#9a9080', cap: false }, // P15R
  { street: 'Im Rebgärtle', t: 'flowers', pts: [[42.5, -371.8], [45.1, -375.6]], h: 0.6, w: 1, colors: ['#6a8a4a', '#9ab0c0', '#d8d0a0'] }, // P15R
  { street: 'Im Rebgärtle', t: 'shrub', p: [44.9, -374.2], r: 1.4, h: 3.5, kind: 'green', color: '#4a7a35' }, // P15R
  { street: 'Im Rebgärtle', t: 'fence', pts: [[61.3, -402.3], [56, -393.4], [52.9, -388.2], [52.4, -385.3], [56, -382.3], [60, -379.9], [62.5, -378.2]], h: 1, style: 'panel', color: '#f2f2ee' }, // P16R+P25L+P17R+Luftbild
  { street: 'Im Rebgärtle', t: 'flowers', pts: [[53.1, -388.2], [53, -386], [56.4, -383.2], [59.6, -381.2]], h: 0.4, w: 0.8, colors: ['#e8c830', '#f0d860'] }, // P16R
  { street: 'Im Rebgärtle', t: 'shrub', p: [54, -388], r: 1, h: 1.5, kind: 'green', color: '#a03030' }, // P16R (Glanzmispel)
  { street: 'Im Rebgärtle', t: 'shrub', p: [56.8, -385.6], r: 0.9, h: 1.4, kind: 'green', color: '#5a2a40' }, // P16R
  { street: 'Im Rebgärtle', t: 'shrub', p: [55.8, -390.9], r: 1.6, h: 2, kind: 'green' }, // P16R+Luftbild
  { street: 'Im Rebgärtle', t: 'shrub', p: [57, -389.5], r: 0.6, h: 1.2, kind: 'grass' }, // P16R
  { street: 'Im Rebgärtle', t: 'shrub', p: [59.4, -382.4], r: 0.9, h: 1.5, kind: 'hydrangea', flower: '#f0d8d8' }, // P25L
  { street: 'Im Rebgärtle', t: 'shrub', p: [61.6, -380.6], r: 0.7, h: 1.5, kind: 'grass', color: '#7a9a50' }, // P25L
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[58.5, -388.5], [63, -386]], h: 1.8, w: 1, kind: 'privet', color: '#6a8a2a' }, // P16R+P25L
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[49.8, -377.9], [53.3, -375.6], [57.3, -373]], h: 2.6, w: 1.8, kind: 'wild' }, // P25R
  { street: 'Im Rebgärtle', t: 'shrub', p: [52, -377], r: 0.6, h: 1, kind: 'rose', flower: '#d02040' }, // P25R
  { street: 'Im Rebgärtle', t: 'shrub', p: [73, -372.4], r: 0.9, h: 1.6, kind: 'green', color: '#5a7a30' }, // P26L (Glanzmispel)
  { street: 'Im Rebgärtle', t: 'planter', p: [72.9, -363.6], kind: 'pot', color: '#6a6a6a', colors: ['#7a9a50'] }, // P26R
  { street: 'Im Rebgärtle', t: 'flowers', p: [62.3, -403.9], r: 0.5, h: 0.3, colors: ['#f4f4f4'] }, // P17R
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[63.3, -404.6], [63.4, -402.6]], h: 2.5, w: 1.4, kind: 'laurel' }, // P17R
  { street: 'Im Rebgärtle', t: 'shrub', p: [63.9, -405.7], r: 0.9, h: 1.6, kind: 'green', color: '#5a2a35' }, // P17R
  { street: 'Im Rebgärtle', t: 'shrub', p: [64.2, -406.3], r: 0.9, h: 1.4, kind: 'green', color: '#6a2a30' }, // P17R
  { street: 'Im Rebgärtle', t: 'shrub', p: [64.8, -407.4], r: 0.8, h: 1.2, kind: 'green', color: '#a8b040' }, // P17R
  { street: 'Im Rebgärtle', t: 'shrub', p: [66, -409.2], r: 1, h: 1.4, kind: 'green' }, // P17R+Luftbild
  { street: 'Im Rebgärtle', t: 'shrub', p: [67.2, -411.1], r: 1.1, h: 1.5, kind: 'green', color: '#4a7a35' }, // P17R+Luftbild
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[67.9, -412.9], [70.8, -417.7]], h: 1.5, w: 0.9, kind: 'privet' }, // P17R
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[71.9, -419.1], [74.5, -416.7], [79, -414.1]], h: 2.2, w: 1.2, kind: 'laurel', color: '#3a4a2a' }, // P18R
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[79.9, -413.7], [84.8, -410.8], [88.3, -408.8]], h: 1.1, w: 0.9, kind: 'laurel', color: '#4a7a2e' }, // P23R
  { street: 'Im Rebgärtle', t: 'shrub', p: [77.8, -409], r: 1.2, h: 2.5, kind: 'green', color: '#c05a30' }, // P23R (Fächerahorn)
  { street: 'Im Rebgärtle', t: 'wall', pts: [[74.5, -423.6], [74.2, -423.1]], h: 1, w: 0.8, mat: 'sandstone', color: '#b0a080', cap: false }, // P18R (Blocksteine)
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[74.4, -423.5], [79, -421.4], [86.5, -417.2], [94, -413], [99, -410.2]], h: 1.6, w: 0.9, kind: 'privet', color: '#6a8a2a' }, // P18R+P23L+Luftbild
  { street: 'Im Rebgärtle', t: 'shrub', p: [100.6, -409.2], r: 0.5, h: 3.2, kind: 'conifer', color: '#2f4a2a' }, // P24L
  { street: 'Im Rebgärtle', t: 'shrub', p: [100.9, -410.4], r: 0.5, h: 3, kind: 'conifer', color: '#2f4a2a' }, // P24L
  { street: 'Im Rebgärtle', t: 'wall', pts: [[101.4, -408.4], [104.2, -407.6], [106, -406.4]], h: 1, w: 0.8, mat: 'limestone', color: '#d8d0c0', cap: false }, // P24L (Blocksteine)
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[101.8, -409.8], [104.6, -409], [106.5, -407.6]], h: 2.3, w: 1.2, kind: 'laurel' }, // P24L
  { street: 'Im Rebgärtle', t: 'wall', pts: [[98.2, -403.4], [98, -396]], h: 1.2, w: 0.3, mat: 'concrete', color: '#b8b4ac' }, // P24R (L-Steine)
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[76.6, -422.7], [80.5, -429.5], [84.5, -439.5], [86.7, -443.4]], h: 1.4, w: 1, kind: 'laurel', color: '#4f7a2e', flower: '#a83a2a' }, // P19R+Luftbild (Glanzmispel)
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[86.8, -444], [89.6, -448.5], [91.7, -451.9]], h: 0.7, w: 0.6, kind: 'mixed', color: '#7a2a2a' }, // P19R+Luftbild (Blutberberitze)
  { street: 'Im Rebgärtle', t: 'shrub', p: [89.2, -440.6], r: 1.3, h: 2.5, kind: 'green', color: '#8a3030' }, // P19R
  { street: 'Im Rebgärtle', t: 'shrub', p: [96.1, -458.1], r: 1.2, h: 2, kind: 'green' }, // P20R+Luftbild
  { street: 'Im Rebgärtle', t: 'shrub', p: [97.9, -460.8], r: 1.4, h: 3.5, kind: 'green', color: '#6a8a3a' }, // P20R
  { street: 'Im Rebgärtle', t: 'shrub', p: [96, -458.7], r: 0.7, h: 0.9, kind: 'green' }, // P20R
  { street: 'Im Rebgärtle', t: 'shrub', p: [94.3, -452], r: 1, h: 1.4, kind: 'green' }, // P20R
  { street: 'Im Rebgärtle', t: 'planter', p: [98.7, -455.8], r: 0.6, kind: 'trough', color: '#c8c8c0', colors: ['#3f6a2e'] }, // P20R (Steinblock-Kübel)
  { street: 'Im Rebgärtle', t: 'wall', pts: [[102.6, -470], [105.9, -475.7], [108.8, -480.7], [111.8, -485.6], [115, -489.7], [117.4, -494.5]], h: 0.6, w: 0.3, mat: 'concrete', color: '#6a6a6a' }, // P21R+P22R+Luftbild (anthrazit Mauersteine mit Pfeilern)
  { street: 'Im Rebgärtle', t: 'hedge', pts: [[118.3, -495.1], [122.8, -499], [125.9, -501.7]], h: 1, w: 0.8, kind: 'mixed', color: '#8a9a3a' }, // P22R+Luftbild
  { street: 'Im Rebgärtle', t: 'shrub', p: [118.5, -490], r: 0.8, h: 1.6, kind: 'conifer', color: '#3f5a2a' }, // P22R (Formkiefer)
  { street: 'Im Rebgärtle', t: 'shrub', p: [120, -494], r: 0.8, h: 1.8, kind: 'grass', color: '#d8c8a0' }, // P22R (Pampasgras)
  { street: 'Im Rebgärtle', t: 'shrub', p: [121.5, -497], r: 0.8, h: 1.8, kind: 'grass', color: '#d8c8a0' }, // P22R (Pampasgras)
  { street: 'Im Rebgärtle', t: 'fence', pts: [[106.2, -488], [110.1, -493.2], [113.5, -498.5], [116, -503]], h: 1.2, style: 'wire', color: '#6d6d5f' }, // P22L+Luftbild (Spielplatz)
  // ===== Im Steingässle =====
  { street: 'Im Steingässle', t: 'fence', pts: [[-1086.5, 734.2], [-1086.3, 729.5]], h: 1.8, style: 'privacy', color: '#4b4f55' }, // P0L+FriedhofP3L+Luftbild
  { street: 'Im Steingässle', t: 'shrub', p: [-1085.4, 731.9], r: 0.7, h: 0.9, kind: 'hydrangea', flower: '#8a8fd0' }, // FriedhofP2L
  { street: 'Im Steingässle', t: 'shrub', p: [-1085.4, 730.4], r: 0.7, h: 0.9, kind: 'hydrangea', flower: '#b48ac8' }, // FriedhofP2L
  { street: 'Im Steingässle', t: 'hedge', pts: [[-1091.5, 729.5], [-1091, 725]], h: 1, w: 0.8, kind: 'mixed', color: '#4f7a34' }, // P0L+Luftbild
  { street: 'Im Steingässle', t: 'shrub', p: [-1092.5, 723.3], r: 1.3, h: 2.5, kind: 'flowering', flower: '#f0dde8' }, // P0L
  // ===== Kapellenweg =====
  { street: 'Kapellenweg', t: 'hedge', pts: [[57.7, -2.2], [54.7, 6], [51.2, 15.8]], h: 2.8, w: 1.8, kind: 'laurel', color: '#3f6a2a' }, // P29R+P30R+Luftbild
  { street: 'Kapellenweg', t: 'planter', p: [56.1, -5], kind: 'pot', color: '#3a3a3a', colors: ['#4a7a3a'] }, // P29R
  { street: 'Kapellenweg', t: 'planter', p: [55.5, -5.7], kind: 'pot', color: '#3a3a3a', colors: ['#4a7a3a'] }, // P29R
  { street: 'Kapellenweg', t: 'shrub', p: [62.6, 6.9], r: 0.8, h: 1.3, kind: 'green' }, // P29L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [61.3, 9.9], r: 0.7, h: 1, kind: 'green' }, // P29L+Luftbild
  { street: 'Kapellenweg', t: 'hedge', pts: [[60.4, 13.5], [59.4, 16.9], [58.8, 20.4]], h: 1.8, w: 2, kind: 'mixed', color: '#6e8a3a' }, // P29L+P30L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [67.4, 1], r: 0.9, h: 1.5, kind: 'conifer', color: '#c4b84a' }, // P29L
  { street: 'Kapellenweg', t: 'hedge', pts: [[58.7, 28.2], [56.6, 34]], h: 1.4, w: 1, kind: 'privet' }, // P30L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [72.8, -18.9], r: 1.3, h: 3.5, kind: 'conifer', color: '#3e6a34' }, // P28L+Luftbild
  { street: 'Kapellenweg', t: 'flowers', p: [72.1, -20.3], r: 0.6, h: 0.3, colors: ['#e8508a', '#f07ab0', '#d03060'] }, // P28L
  { street: 'Kapellenweg', t: 'hedge', pts: [[71.5, -50.7], [66.5, -50]], h: 1.2, w: 0.8, kind: 'mixed' }, // Luftbild+P27R
  { street: 'Kapellenweg', t: 'hedge', pts: [[63.4, -42], [63.2, -34]], h: 1.8, w: 1.2, kind: 'mixed' }, // Luftbild+P27R
  { street: 'Kapellenweg', t: 'shrub', p: [73.8, -55.5], r: 1.5, h: 2.2, kind: 'green' }, // P26R+Luftbild
  { street: 'Kapellenweg', t: 'fence', pts: [[85.5, -58.9], [87.5, -57.8]], h: 0.5, style: 'white', color: '#e8e4dc' }, // P26L
  { street: 'Kapellenweg', t: 'wall', pts: [[87.5, -57.8], [90.3, -56.5]], h: 1.3, w: 0.5, mat: 'gabion', color: '#9a948a', cap: false }, // P26L+Luftbild
  { street: 'Kapellenweg', t: 'hedge', pts: [[88.9, -57], [92.5, -55.2]], h: 2.2, w: 1.2, kind: 'privet' }, // P26L+Luftbild
  { street: 'Kapellenweg', t: 'planter', p: [85.5, -56.1], kind: 'trough', color: '#8a6a48', colors: ['#d04060', '#f0f0f0'], rot: 0.4 }, // P26L
  { street: 'Kapellenweg', t: 'wall', pts: [[96, -85.4], [89.8, -70]], h: 0.5, w: 0.3, mat: 'concrete', color: '#b8b4aa' }, // P25L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [96.6, -82.9], r: 1.6, h: 2.5, kind: 'green' }, // P25L
  { street: 'Kapellenweg', t: 'shrub', p: [94.9, -79.2], r: 1.4, h: 2, kind: 'green' }, // P25L
  { street: 'Kapellenweg', t: 'shrub', p: [93.2, -76.5], r: 0.6, h: 0.9, kind: 'rose', flower: '#e8609a' }, // P25L
  { street: 'Kapellenweg', t: 'shrub', p: [92.6, -75], r: 0.6, h: 0.9, kind: 'rose', flower: '#f08cb4' }, // P25L
  { street: 'Kapellenweg', t: 'shrub', p: [91.6, -72.7], r: 0.8, h: 1, kind: 'green' }, // P25L
  { street: 'Kapellenweg', t: 'hedge', pts: [[94.1, -102.9], [91.9, -98.1], [89.1, -91.3]], h: 2.5, w: 2.5, kind: 'wild' }, // P24R+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [88.5, -99.5], r: 2, h: 3.8, kind: 'green' }, // P24R+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [96, -107], r: 0.8, h: 1.2, kind: 'green', color: '#b03028' }, // P23R+Luftbild
  { street: 'Kapellenweg', t: 'wall', pts: [[112.6, -126.7], [107.8, -114.9]], h: 0.9, w: 0.3, mat: 'concrete', color: '#c2bfb6', fence: 'privacy', fenceH: 1 }, // P22L+P23L
  { street: 'Kapellenweg', t: 'wall', pts: [[107.8, -114.9], [104.1, -105.6]], h: 0.7, w: 0.3, mat: 'concrete', color: '#c2bfb6' }, // P23L+Luftbild
  { street: 'Kapellenweg', t: 'hedge', pts: [[108.3, -114.2], [104.8, -105.5]], h: 2.5, w: 1.3, kind: 'privet', color: '#4f7a32' }, // P23L+Luftbild
  { street: 'Kapellenweg', t: 'hedge', pts: [[118.2, -135.8], [116.2, -130.8], [114.6, -126.9]], h: 2.5, w: 2.5, kind: 'wild' }, // P22L+Luftbild
  { street: 'Kapellenweg', t: 'fence', pts: [[110, -137.5], [107.2, -131], [104.9, -125.3], [102.9, -120.1]], h: 1.1, style: 'metal', color: '#3a3a3a' }, // P22R+Luftbild
  { street: 'Kapellenweg', t: 'hedge', pts: [[110, -137.7], [110.6, -141.2], [108.5, -143.2], [104.5, -144.6]], h: 1.4, w: 1, kind: 'privet', color: '#3f5e2c' }, // P22R+Luftbild
  { street: 'Kapellenweg', t: 'hedge', pts: [[111, -149.6], [116.2, -149.6], [118.9, -153.8]], h: 0.7, w: 0.7, kind: 'boxwood' }, // P00L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [114, -153.8], r: 0.6, h: 3.8, kind: 'conifer', color: '#3a5a2a' }, // P00L
  { street: 'Kapellenweg', t: 'shrub', p: [114.9, -154.6], r: 0.6, h: 3.6, kind: 'conifer', color: '#3a5a2a' }, // P00L
  { street: 'Kapellenweg', t: 'shrub', p: [116.5, -152.4], r: 1.2, h: 2.2, kind: 'green', color: '#a3262a' }, // P00L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [113, -151.6], r: 0.9, h: 1.6, kind: 'green', color: '#8aa040' }, // P00L
  { street: 'Kapellenweg', t: 'shrub', p: [112, -151.2], r: 0.8, h: 1.8, kind: 'green', color: '#8a4a3a' }, // P00L
  { street: 'Kapellenweg', t: 'fence', pts: [[123.2, -148.4], [127.2, -152.1], [133.2, -160.1], [139.3, -168.1], [145.3, -176.1]], h: 1, style: 'rustic', color: '#a07850' }, // P00R+P01R+P02R
  { street: 'Kapellenweg', t: 'hedge', pts: [[124.8, -147.6], [130.5, -154.1], [136.5, -162.1], [142.5, -170.1]], h: 2.8, w: 2.5, kind: 'wild' }, // P00R+P01R
  { street: 'Kapellenweg', t: 'wall', pts: [[127.8, -167], [131.9, -172.4]], h: 0.4, w: 0.2, mat: 'concrete', color: '#a8a49c', cap: false }, // P01L
  { street: 'Kapellenweg', t: 'shrub', p: [131.2, -172.3], r: 1, h: 2, kind: 'green', color: '#3d5e2a' }, // P01L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [132.7, -174], r: 0.7, h: 1.4, kind: 'green' }, // P01L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [129.6, -168.8], r: 0.6, h: 0.9, kind: 'grass' }, // P01L
  { street: 'Kapellenweg', t: 'shrub', p: [130.4, -170.2], r: 0.5, h: 0.8, kind: 'grass' }, // P01L
  { street: 'Kapellenweg', t: 'shrub', p: [137.5, -183.5], r: 1.8, h: 3, kind: 'green', color: '#355a28' }, // P02L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [150.6, -179.2], r: 0.6, h: 1, kind: 'boxwood' }, // P02R
  { street: 'Kapellenweg', t: 'wall', pts: [[156, -205.6], [153.5, -207.2]], h: 1, w: 0.3, mat: 'plaster', color: '#e8e6e0' }, // P03L+Luftbild
  { street: 'Kapellenweg', t: 'wall', pts: [[156.4, -205.8], [160.8, -212.7]], h: 0.4, w: 0.2, mat: 'concrete', color: '#a8a49c', cap: false }, // P03L
  { street: 'Kapellenweg', t: 'hedge', pts: [[156.2, -206.4], [160.4, -213]], h: 1, w: 1, kind: 'copper', color: '#6e2c2c' }, // P03L+P04L+Luftbild
  { street: 'Kapellenweg', t: 'hedge', pts: [[163.5, -217.5], [167.2, -223.4], [169.9, -227.7]], h: 1.1, w: 0.9, kind: 'copper', color: '#6a2b2e' }, // P04L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [162.8, -224.8], r: 2, h: 3.2, kind: 'green', color: '#a0302a' }, // P04L+Luftbild
  { street: 'Kapellenweg', t: 'hedge', pts: [[161.6, -195.7], [165.4, -201.7]], h: 2.5, w: 2.5, kind: 'wild', color: '#7a8a30' }, // P03R
  { street: 'Kapellenweg', t: 'shrub', p: [171.5, -213.9], r: 0.4, h: 0.7, kind: 'grass' }, // P04R+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [173, -215.9], r: 0.5, h: 0.8, kind: 'grass' }, // P04R+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [174.5, -218.3], r: 0.4, h: 0.6, kind: 'grass' }, // P04R+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [175.9, -220.4], r: 0.5, h: 0.6, kind: 'boxwood' }, // P04R+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [176.8, -222.5], r: 1.3, h: 1.8, kind: 'green' }, // P04R+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [175.6, -215.9], r: 1.6, h: 3.5, kind: 'green' }, // P04R
  { street: 'Kapellenweg', t: 'hedge', pts: [[189.2, -218.4], [182.8, -222.2], [178.7, -224.6]], h: 0.9, w: 0.8, kind: 'privet', color: '#3e5e2a' }, // P16L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [196.7, -212.3], r: 0.8, h: 1.3, kind: 'green' }, // P16L
  { street: 'Kapellenweg', t: 'hedge', pts: [[196, -222], [201, -219.1]], h: 0.6, w: 0.8, kind: 'mixed', color: '#3e5a30' }, // P15L
  { street: 'Kapellenweg', t: 'hedge', pts: [[185, -231.2], [187.5, -232.8], [189.5, -232.2]], h: 3, w: 1.5, kind: 'bamboo', color: '#9aa83a' }, // P16R+P17R
  { street: 'Kapellenweg', t: 'shrub', p: [184.8, -229.6], r: 0.6, h: 0.8, kind: 'grass', color: '#5a8a6a' }, // P16R
  { street: 'Kapellenweg', t: 'flowers', p: [184.2, -229], r: 0.5, h: 0.3, colors: ['#d898b8', '#c87aa8'] }, // P16R
  { street: 'Kapellenweg', t: 'shrub', p: [186.6, -235.5], r: 1.6, h: 2.5, kind: 'green', color: '#8aa040' }, // P16R+P17R
  { street: 'Kapellenweg', t: 'hedge', pts: [[186.1, -236.6], [189.8, -242.5], [193.4, -248.5]], h: 2, w: 2.5, kind: 'mixed' }, // P17R+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [192.6, -247], r: 1, h: 1.8, kind: 'green', color: '#9a3a3a' }, // P17R+Luftbild
  { street: 'Kapellenweg', t: 'wall', pts: [[200.6, -221], [205, -218.4], [209.5, -215.7]], h: 1, w: 1.2, mat: 'sandstone', color: '#b07a62', fence: 'privacy', fenceH: 1.6 }, // P15R+Luftbild
  { street: 'Kapellenweg', t: 'flowers', pts: [[200.5, -220.5], [209, -215.4]], h: 0.3, w: 0.6, colors: ['#b8c4a0', '#d8c040', '#c8b0a0'] }, // P15R
  { street: 'Kapellenweg', t: 'shrub', p: [222, -208.6], r: 1.8, h: 2.2, kind: 'conifer', color: '#557a45' }, // P14L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [225.2, -206.8], r: 1.5, h: 2.5, kind: 'green' }, // P14L+Luftbild
  { street: 'Kapellenweg', t: 'wall', pts: [[216.2, -213.1], [216.3, -215.3]], h: 0.8, w: 0.3, mat: 'concrete', color: '#c8c6c0' }, // P14R
  { street: 'Kapellenweg', t: 'shrub', p: [215.2, -215.3], r: 0.8, h: 1.3, kind: 'green' }, // P14R
  { street: 'Kapellenweg', t: 'hedge', pts: [[238.6, -222.6], [237.3, -221.1], [235.3, -218.5]], h: 0.4, w: 1.2, kind: 'ivy', color: '#3e5a30' }, // P13L
  { street: 'Kapellenweg', t: 'shrub', p: [237.8, -219.5], r: 1, h: 1.6, kind: 'green' }, // P13L
  { street: 'Kapellenweg', t: 'shrub', p: [236.5, -217.1], r: 0.7, h: 1.1, kind: 'green' }, // P13L
  { street: 'Kapellenweg', t: 'shrub', p: [235, -212.8], r: 1.2, h: 2, kind: 'green' }, // P13L
  { street: 'Kapellenweg', t: 'shrub', p: [230.7, -209.8], r: 1.2, h: 1.5, kind: 'green' }, // P13L
  { street: 'Kapellenweg', t: 'wall', pts: [[235.5, -219.5], [231.4, -214.4]], h: 0.3, w: 0.3, mat: 'stone', color: '#a09888', cap: false }, // P13L
  { street: 'Kapellenweg', t: 'planter', p: [240.8, -219.2], kind: 'pot', color: '#b06a40', colors: ['#d02030'] }, // P13L
  { street: 'Kapellenweg', t: 'wall', pts: [[233.3, -228.4], [234, -229.3]], h: 0.5, w: 0.5, mat: 'granite', color: '#a8a8a2', cap: false }, // P13R
  { street: 'Kapellenweg', t: 'shrub', p: [232.4, -229], r: 0.9, h: 1.6, kind: 'green', color: '#b8b030' }, // P13R
  { street: 'Kapellenweg', t: 'shrub', p: [233, -229.6], r: 0.8, h: 1.6, kind: 'green', color: '#8a3030' }, // P13R
  { street: 'Kapellenweg', t: 'fence', pts: [[254.4, -240.9], [253.6, -239.9]], h: 1, style: 'wood', color: '#4a3a2e' }, // P12L
  { street: 'Kapellenweg', t: 'shrub', p: [253.4, -238], r: 0.6, h: 1.2, kind: 'grass', color: '#5a8a5a' }, // P12L
  { street: 'Kapellenweg', t: 'shrub', p: [252.9, -236.6], r: 1, h: 1.8, kind: 'green' }, // P12L
  { street: 'Kapellenweg', t: 'hedge', pts: [[251.2, -234.5], [250.1, -233.1]], h: 2, w: 1.2, kind: 'ivy' }, // P12L
  { street: 'Kapellenweg', t: 'shrub', p: [250.5, -251.2], r: 1.5, h: 2.5, kind: 'green' }, // P11R+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [254.6, -255.6], r: 1.2, h: 2.2, kind: 'green' }, // Luftbild+P11R
  { street: 'Kapellenweg', t: 'fence', pts: [[258.7, -241.5], [256.2, -244], [254.2, -241.4]], h: 1, style: 'wood', color: '#4a3a2e' }, // P11L
  { street: 'Kapellenweg', t: 'flowers', pts: [[256.1, -244.6], [254.5, -242.6]], h: 0.5, w: 0.8, colors: ['#e8c030', '#e07030', '#d05080'] }, // P11L
  { street: 'Kapellenweg', t: 'shrub', p: [255, -240.8], r: 0.6, h: 1.2, kind: 'green' }, // P11L
  { street: 'Kapellenweg', t: 'shrub', p: [260.4, -246.8], r: 1.2, h: 2, kind: 'green' }, // P11L
  { street: 'Kapellenweg', t: 'planter', p: [260.9, -244.2], kind: 'barrel', color: '#8a6a48', colors: ['#6a9a40'] }, // P11L
  { street: 'Kapellenweg', t: 'shrub', p: [271.4, -261.4], r: 2, h: 4, kind: 'green' }, // P10L+Luftbild
  { street: 'Kapellenweg', t: 'hedge', pts: [[270.7, -262.6], [269.6, -261.2], [267.8, -259]], h: 0.9, w: 1.5, kind: 'mixed' }, // P10L
  { street: 'Kapellenweg', t: 'fence', pts: [[271.6, -262.8], [271.6, -258.3]], h: 0.9, style: 'rustic', color: '#9a6a40' }, // P10L
  { street: 'Kapellenweg', t: 'flowers', p: [274.3, -260], r: 0.8, h: 0.6, colors: ['#c02030', '#e04050'] }, // P10L
  { street: 'Kapellenweg', t: 'hedge', pts: [[261, -263.7], [265.9, -269.8], [271, -276.1]], h: 2.8, w: 1.4, kind: 'laurel', color: '#3d6428' }, // P10R+Luftbild
  { street: 'Kapellenweg', t: 'hedge', pts: [[272.3, -277], [275.4, -281]], h: 1.4, w: 1.2, kind: 'mixed' }, // P09R+Luftbild
  { street: 'Kapellenweg', t: 'fence', pts: [[277.4, -283.2], [279.6, -288.3], [282.4, -294.6]], h: 1, style: 'panel', color: '#3a3c3e' }, // P09R+P08R+Luftbild
  { street: 'Kapellenweg', t: 'fence', pts: [[276.4, -281.3], [277.4, -283.2]], h: 1.2, style: 'metal', color: '#3a3c3e' }, // P09R
  { street: 'Kapellenweg', t: 'wall', pts: [[285.3, -281.6], [284.5, -280.1], [283.3, -278.7], [281.6, -276.7]], h: 0.6, w: 0.3, mat: 'brick', color: '#b8907a', capColor: '#c8a890' }, // P09L
  { street: 'Kapellenweg', t: 'hedge', pts: [[288.3, -280.3], [285.7, -275.8]], h: 1.3, w: 0.8, kind: 'privet' }, // P09L
  { street: 'Kapellenweg', t: 'shrub', p: [286.1, -279.5], r: 1, h: 1.3, kind: 'green', color: '#c8b832' }, // P09L
  { street: 'Kapellenweg', t: 'hedge', pts: [[286, -281.3], [285, -278.9]], h: 0.5, w: 0.6, kind: 'boxwood', color: '#8aa84a' }, // P09L
  { street: 'Kapellenweg', t: 'shrub', p: [283.8, -275.9], r: 0.8, h: 1.8, kind: 'conifer' }, // P09L
  { street: 'Kapellenweg', t: 'shrub', p: [283.2, -274.3], r: 0.9, h: 2.5, kind: 'conifer' }, // P09L
  { street: 'Kapellenweg', t: 'shrub', p: [283.2, -276.2], r: 1, h: 1.2, kind: 'green' }, // P09L
  { street: 'Kapellenweg', t: 'shrub', p: [282.3, -274], r: 1, h: 1.1, kind: 'green' }, // P09L
  { street: 'Kapellenweg', t: 'shrub', p: [292.4, -302.1], r: 0.9, h: 3, kind: 'conifer' }, // P08L
  { street: 'Kapellenweg', t: 'shrub', p: [292.1, -301.3], r: 0.7, h: 1.5, kind: 'conifer', color: '#7a9aa0' }, // P08L
  { street: 'Kapellenweg', t: 'shrub', p: [291.7, -300.9], r: 0.7, h: 1.2, kind: 'conifer', color: '#c8b030' }, // P08L
  { street: 'Kapellenweg', t: 'hedge', pts: [[290.4, -302.6], [290.8, -301.8]], h: 0.9, w: 1.2, kind: 'mixed' }, // P08L
  { street: 'Kapellenweg', t: 'hedge', pts: [[291.3, -300.7], [291.4, -299.2], [291.5, -296.6]], h: 1.6, w: 1.5, kind: 'mixed' }, // P08L
  { street: 'Kapellenweg', t: 'hedge', pts: [[282.8, -295.2], [282.3, -298.8], [281.4, -300.5]], h: 0.5, w: 1.2, kind: 'mixed', color: '#7f9472' }, // P08R
  { street: 'Kapellenweg', t: 'shrub', p: [280.2, -298], r: 1.5, h: 3.5, kind: 'green' }, // P08R
  { street: 'Kapellenweg', t: 'hedge', pts: [[276.7, -305.3], [272.5, -307.8], [270, -309.3]], h: 0.5, w: 1.2, kind: 'mixed', color: '#5a6a40' }, // P07R+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [272.5, -318], r: 2.3, h: 3.8, kind: 'green', color: '#a84a2a' }, // P07L+P06R+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [280, -316.6], r: 0.5, h: 3.5, kind: 'conifer' }, // P07L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [281.4, -317.6], r: 0.5, h: 3.5, kind: 'conifer' }, // P07L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [281.6, -315.4], r: 0.6, h: 1, kind: 'grass' }, // P07L
  { street: 'Kapellenweg', t: 'shrub', p: [286, -318], r: 1.6, h: 2.5, kind: 'conifer', color: '#3e5a30' }, // P07L+Luftbild
  { street: 'Kapellenweg', t: 'hedge', pts: [[238, -327.6], [243, -328.8], [245.3, -331], [245.6, -335]], h: 1.8, w: 1.2, kind: 'privet' }, // P06L+P05L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [248.9, -319], r: 0.6, h: 1, kind: 'grass' }, // P06R
  { street: 'Kapellenweg', t: 'shrub', p: [250.4, -318.5], r: 0.4, h: 0.7, kind: 'grass' }, // P06R
  { street: 'Kapellenweg', t: 'shrub', p: [252.2, -319.1], r: 0.4, h: 0.5, kind: 'boxwood' }, // P06R
  { street: 'Kapellenweg', t: 'shrub', p: [254.2, -318.2], r: 0.6, h: 1, kind: 'green', color: '#8a2a2a' }, // P06R
  { street: 'Kapellenweg', t: 'wall', pts: [[226, -305], [227.3, -307.1], [229.3, -310.1]], h: 1.3, w: 0.3, mat: 'concrete', color: '#d0cec8', cap: false }, // P05R+P21R+Luftbild
  { street: 'Kapellenweg', t: 'wall', pts: [[231.5, -309.6], [234.5, -310.5], [237.8, -312.5]], h: 1.6, w: 0.3, mat: 'concrete', color: '#c4c2bc', cap: false }, // P05R+Luftbild
  { street: 'Kapellenweg', t: 'hedge', pts: [[235.3, -309.3], [238, -311]], h: 3.3, w: 1.2, kind: 'privet' }, // P05R
  { street: 'Kapellenweg', t: 'shrub', p: [231.1, -308.1], r: 2, h: 2.8, kind: 'conifer', color: '#d4c040' }, // P21R
  { street: 'Kapellenweg', t: 'shrub', p: [230.8, -309.2], r: 0.8, h: 1.3, kind: 'green' }, // P21R
  { street: 'Kapellenweg', t: 'shrub', p: [232, -306.5], r: 1.2, h: 2.5, kind: 'grass', color: '#9aa860' }, // P05R+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [238.2, -317.2], r: 0.8, h: 1.2, kind: 'green' }, // Luftbild
  { street: 'Kapellenweg', t: 'hedge', pts: [[170.5, -238.3], [175, -242.3], [179, -245.2], [183.2, -247.4]], h: 0.9, w: 2, kind: 'boxwood', color: '#7a9a3a' }, // P17L+P04L+Luftbild
  { street: 'Kapellenweg', t: 'hedge', pts: [[187.8, -253.8], [182.6, -259.2]], h: 1, w: 1.2, kind: 'privet' }, // P18L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [182, -258.2], r: 0.8, h: 1.2, kind: 'green', color: '#8a3a30' }, // Luftbild
  { street: 'Kapellenweg', t: 'hedge', pts: [[186.5, -261.5], [190.8, -258.8]], h: 0.6, w: 0.8, kind: 'boxwood', color: '#3e5a2e' }, // P18L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [188.2, -264.2], r: 1, h: 1.3, kind: 'boxwood' }, // P18L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [192, -262.2], r: 1, h: 1.4, kind: 'boxwood' }, // P18L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [190.9, -267.3], r: 0.8, h: 1.2, kind: 'boxwood' }, // P19L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [194, -266.2], r: 0.7, h: 1, kind: 'boxwood' }, // P19L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [189.5, -263], r: 0.6, h: 2, kind: 'conifer' }, // P18L
  { street: 'Kapellenweg', t: 'shrub', p: [194.6, -271.8], r: 1.3, h: 0.6, kind: 'green', color: '#4a5a38' }, // P19L
  { street: 'Kapellenweg', t: 'shrub', p: [193.8, -269.6], r: 1.2, h: 0.5, kind: 'green', color: '#4a5a38' }, // P19L
  { street: 'Kapellenweg', t: 'shrub', p: [203, -283], r: 1.8, h: 3, kind: 'conifer', color: '#3f5a30' }, // P19L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [206.3, -288], r: 1.6, h: 2.2, kind: 'green' }, // P20L+Luftbild
  { street: 'Kapellenweg', t: 'shrub', p: [207.6, -288.8], r: 0.8, h: 0.9, kind: 'green', color: '#9a2a2a' }, // P20L
  { street: 'Kapellenweg', t: 'shrub', p: [216.1, -303.3], r: 0.7, h: 3.8, kind: 'conifer' }, // P20L+P21L+Luftbild
  { street: 'Kapellenweg', t: 'wall', pts: [[221, -309], [221.3, -309.5], [221.9, -310.5]], h: 1.2, w: 0.8, mat: 'granite', color: '#a6a49e', cap: false }, // P21L
  { street: 'Kapellenweg', t: 'planter', p: [220.8, -309.7], kind: 'pot', color: '#b86a40', colors: ['#5a8a3a'] }, // P21L
  { street: 'Kapellenweg', t: 'planter', p: [221.1, -310.2], kind: 'pot', color: '#b86a40', colors: ['#5a8a3a'] }, // P21L
  { street: 'Kapellenweg', t: 'planter', p: [221.6, -310.9], kind: 'pot', color: '#b86a40', colors: ['#5a8a3a'] }, // P21L
  { street: 'Kapellenweg', t: 'shrub', p: [197.3, -254.8], r: 0.8, h: 1.3, kind: 'green' }, // P18R
  { street: 'Kapellenweg', t: 'shrub', p: [197.1, -253.6], r: 1, h: 2.5, kind: 'green', color: '#6a2a30' }, // P18R
  { street: 'Kapellenweg', t: 'shrub', p: [196.6, -252.7], r: 0.7, h: 2, kind: 'grass', color: '#a8b040' }, // P18R
  { street: 'Kapellenweg', t: 'shrub', p: [195.5, -250.9], r: 1.2, h: 2, kind: 'conifer' }, // P18R
  { street: 'Kapellenweg', t: 'shrub', p: [193.2, -248.4], r: 0.7, h: 1.2, kind: 'grass', color: '#b0b050' }, // P18R
  { street: 'Kapellenweg', t: 'wall', pts: [[205.2, -270.8], [202.8, -266.9]], h: 0.2, w: 0.2, mat: 'concrete', color: '#a8a49c', cap: false }, // P19R
  { street: 'Kapellenweg', t: 'shrub', p: [206.3, -268.7], r: 0.7, h: 2, kind: 'conifer', color: '#2e4a28' }, // P19R
  { street: 'Kapellenweg', t: 'shrub', p: [207.1, -269.8], r: 0.4, h: 1.8, kind: 'conifer' }, // P19R
  { street: 'Kapellenweg', t: 'hedge', pts: [[204.6, -267.8], [203.7, -266.2]], h: 1.6, w: 1.2, kind: 'mixed' }, // P19R
  { street: 'Kapellenweg', t: 'shrub', p: [206.2, -267.5], r: 1, h: 2.5, kind: 'green', color: '#c0602a' }, // P19R
  { street: 'Kapellenweg', t: 'wall', pts: [[209.4, -276.5], [207.6, -273.6]], h: 1, w: 0.3, mat: 'plaster', color: '#e8e6e0' }, // P19R
  { street: 'Kapellenweg', t: 'shrub', p: [221.1, -293.7], r: 1, h: 1.5, kind: 'green' }, // P20R
  { street: 'Kapellenweg', t: 'shrub', p: [223.5, -296.7], r: 1, h: 2.5, kind: 'green', color: '#c8b030' }, // P20R
  { street: 'Kapellenweg', t: 'flowers', p: [220.2, -293.9], r: 0.5, h: 0.4, colors: ['#d02030'] }, // P20R
  { street: 'Kapellenweg', t: 'fence', pts: [[218.4, -287.3], [217.9, -286.5]], h: 1, style: 'wire', color: '#3a6a3a' }, // P20R
  { street: 'Kapellenweg', t: 'hedge', pts: [[216.4, -286.9], [215.4, -285.3]], h: 1.5, w: 1.2, kind: 'mixed' }, // P20R
  // ===== Kellermatten =====
  { street: 'Kellermatten', t: 'fence', pts: [[-203.8, -189.3], [-208.2, -181.9], [-212.2, -174.5], [-209.6, -173.4]], h: 1, style: 'picket', color: '#f4f4f2' }, // P00L+P01L+Luftbild
  { street: 'Kellermatten', t: 'shrub', p: [-201.5, -186], r: 1, h: 1.6, kind: 'flowering', color: '#4a6a30', flower: '#e8801a' }, // P00L+P01L (Feuerdorn)
  { street: 'Kellermatten', t: 'hedge', pts: [[-212.6, -171], [-214.6, -166.2]], h: 1.2, w: 0.8, kind: 'privet' }, // P01L+Luftbild
  { street: 'Kellermatten', t: 'shrub', p: [-216.5, -192.6], r: 1.4, h: 3.2, kind: 'green', color: '#7a9a3a' }, // P00R+Luftbild (Kugelbaum)
  { street: 'Kellermatten', t: 'shrub', p: [-215.5, -188.5], r: 1.2, h: 1.2, kind: 'green' }, // P00R+Luftbild
  { street: 'Kellermatten', t: 'shrub', p: [-218, -189.8], r: 1, h: 1.1, kind: 'green', color: '#557f3a' }, // P00R
  { street: 'Kellermatten', t: 'shrub', p: [-219, -193.5], r: 1, h: 2.5, kind: 'conifer', color: '#2f4a2a' }, // P00R+P01R
  { street: 'Kellermatten', t: 'shrub', p: [-214, -186.8], r: 1, h: 0.9, kind: 'green' }, // P00R
  { street: 'Kellermatten', t: 'flowers', pts: [[-219.4, -185], [-215, -184.4]], h: 0.4, w: 1.6, colors: ['#e870a0', '#f4f4f4', '#d03040'] }, // P01R+Luftbild (Hochbeet)
  { street: 'Kellermatten', t: 'planter', p: [-215.3, -183.4], kind: 'barrel', colors: ['#5a8a3a', '#e870a0'] }, // P01R
  { street: 'Kellermatten', t: 'hedge', pts: [[-219.5, -160.5], [-216.5, -160.6]], h: 1.2, w: 0.7, kind: 'privet' }, // P02L+Luftbild
  { street: 'Kellermatten', t: 'hedge', pts: [[-228.8, -171], [-226.6, -167.8]], h: 2, w: 1, kind: 'privet', color: '#2f5a2a' }, // P02R+Luftbild
  { street: 'Kellermatten', t: 'hedge', pts: [[-222.5, -151.5], [-225, -147], [-228, -141.5], [-230.8, -136.8], [-232.6, -136.2]], h: 1.2, w: 0.8, kind: 'privet', color: '#3f6a2e' }, // P02L+P03L+Luftbild (endet an Kiga-Hecke)
  { street: 'Kellermatten', t: 'wall', pts: [[-235.4, -158.4], [-231.2, -154.8], [-236.3, -144.4]], h: 0.6, w: 0.4, mat: 'sandstone', color: '#c8b48a', fence: 'metal', fenceH: 0.8 }, // P03R+Luftbild
  { street: 'Kellermatten', t: 'hedge', pts: [[-238.9, -144.6], [-246.5, -150]], h: 1.6, w: 1, kind: 'privet' }, // P03R+Luftbild
  { street: 'Kellermatten', t: 'hedge', pts: [[-259.5, -116.8], [-255.5, -114.6]], h: 0.8, w: 0.8, kind: 'mixed' }, // P05R+Luftbild
  { street: 'Kellermatten', t: 'hedge', pts: [[-253.9, -96.6], [-258, -89.7], [-261.4, -83.9], [-262.8, -81]], h: 2, w: 1.2, kind: 'thuja', color: '#3f6a2e' }, // P05L+P06L+Luftbild
  { street: 'Kellermatten', t: 'planter', p: [-264, -99.8], kind: 'pot', color: '#b5643c', colors: ['#3f6a2f'] }, // P06R
  { street: 'Kellermatten', t: 'planter', p: [-265.5, -103.4], kind: 'pot', color: '#b5643c', colors: ['#3f6a2f'] }, // P06R
  { street: 'Kellermatten', t: 'flowers', pts: [[-262, -97.5], [-262.5, -104]], h: 0.3, w: 1, colors: ['#d82030', '#4a7a35'] }, // P06R
  { street: 'Kellermatten', t: 'shrub', p: [-266.4, -97], r: 1, h: 1.5, kind: 'green', color: '#3f6a2e' }, // P06R+Luftbild
  { street: 'Kellermatten', t: 'hedge', pts: [[-265, -68], [-261, -62.5]], h: 1.6, w: 2.2, kind: 'laurel', color: '#2f5a2a' }, // P07L+Luftbild
  { street: 'Kellermatten', t: 'shrub', p: [-266.8, -67.8], r: 1.3, h: 3, kind: 'green', color: '#5a8a3a' }, // P07L+Luftbild
  { street: 'Kellermatten', t: 'shrub', p: [-270.8, -61.5], r: 0.9, h: 1.4, kind: 'green' }, // P07L
  { street: 'Kellermatten', t: 'shrub', p: [-277, -82.5], r: 1, h: 3.5, kind: 'conifer', color: '#2f4a2a' }, // P07R+Luftbild
  { street: 'Kellermatten', t: 'flowers', pts: [[-273, -81], [-273.6, -84.5]], h: 0.3, w: 1, colors: ['#4a7a35', '#f4f4f4'] }, // P07R
  { street: 'Kellermatten', t: 'planter', p: [-272.4, -82.2], kind: 'pot', color: '#b5643c', colors: ['#4a7a35'] }, // P07R
  { street: 'Kellermatten', t: 'hedge', pts: [[-276, -79], [-277.8, -74], [-279.5, -70]], h: 1.2, w: 1, kind: 'mixed' }, // P07R+Luftbild
  { street: 'Kellermatten', t: 'shrub', p: [-281.4, -75.4], r: 2.2, h: 3.5, kind: 'green', color: '#6a9a3a' }, // P07R+Luftbild
  { street: 'Kellermatten', t: 'hedge', pts: [[-280.4, -66.4], [-285.4, -68.8]], h: 1.5, w: 1, kind: 'privet' }, // P08R+Luftbild
  { street: 'Kellermatten', t: 'shrub', p: [-290, -61.5], r: 1, h: 3, kind: 'green', color: '#3a5a30' }, // P08R+Luftbild (Hanfpalme)
  { street: 'Kellermatten', t: 'planter', p: [-288, -57], kind: 'pot', color: '#8a8a84', colors: ['#3f6a2f'] }, // P08R
  { street: 'Kellermatten', t: 'planter', p: [-287.4, -55.6], kind: 'pot', color: '#8a8a84', colors: ['#3f6a2f'] }, // P08R
  { street: 'Kellermatten', t: 'shrub', p: [-287.5, -61.4], r: 0.5, h: 0.8, kind: 'green' }, // P08R
  { street: 'Kellermatten', t: 'shrub', p: [-272.5, -58.5], r: 0.8, h: 1.3, kind: 'rose', flower: '#d84a6a' }, // P08L
  { street: 'Kellermatten', t: 'shrub', p: [-279.3, -53.9], r: 0.8, h: 1, kind: 'green' }, // P08L+Luftbild
  { street: 'Kellermatten', t: 'shrub', p: [-280.8, -51.7], r: 0.8, h: 1, kind: 'green' }, // P08L+Luftbild
  { street: 'Kellermatten', t: 'shrub', p: [-282.2, -49.5], r: 0.8, h: 1, kind: 'green' }, // P08L+Luftbild
  { street: 'Kellermatten', t: 'hedge', pts: [[-282.6, -48.5], [-284.2, -41.5]], h: 1.3, w: 1, kind: 'privet' }, // P08L+P09L+Luftbild
  { street: 'Kellermatten', t: 'shrub', p: [-293.5, -51.5], r: 1, h: 3, kind: 'green', color: '#3a5a30' }, // P09R+Luftbild (Hanfpalme)
  { street: 'Kellermatten', t: 'shrub', p: [-294.5, -53.8], r: 1, h: 2, kind: 'green', color: '#6a2a2a' }, // P09R+Luftbild
  { street: 'Kellermatten', t: 'shrub', p: [-293.5, -47.6], r: 0.7, h: 1, kind: 'boxwood' }, // P09R
  { street: 'Kellermatten', t: 'hedge', pts: [[-294.2, -44], [-301, -45.5]], h: 1, w: 0.8, kind: 'privet' }, // P09R+Luftbild
  { street: 'Kellermatten', t: 'hedge', pts: [[-290, -35.5], [-292, -30], [-294.5, -24.5], [-297.5, -19.5], [-300.8, -14.5], [-304.5, -6.5], [-308.1, 1.2]], h: 2, w: 1.2, kind: 'privet', color: '#4a7a30' }, // P09L+P10L+P11L+Luftbild
  { street: 'Kellermatten', t: 'planter', p: [-303.4, -29.2], kind: 'pot', color: '#b5643c', colors: ['#4a7a35'] }, // P10R
  { street: 'Kellermatten', t: 'planter', p: [-303.8, -27.6], kind: 'pot', color: '#b5643c', colors: ['#4a7a35', '#d84a4a'] }, // P10R
  { street: 'Kellermatten', t: 'fence', pts: [[-308.4, -22.4], [-313, -23.8]], h: 1, style: 'panel', color: '#3a6a4a' }, // P11R
  { street: 'Kellermatten', t: 'hedge', pts: [[-308.6, -23.4], [-313, -25]], h: 2, w: 1.5, kind: 'wild' }, // P11R+Luftbild
  { street: 'Kellermatten', t: 'shrub', p: [-322, 8.4], r: 0.7, h: 0.9, kind: 'green' }, // P12R+Luftbild
  { street: 'Kellermatten', t: 'shrub', p: [-324.5, 8], r: 0.7, h: 0.9, kind: 'green', color: '#3f6a2e' }, // P12R+Luftbild
  { street: 'Kellermatten', t: 'shrub', p: [-316.9, 22.5], r: 0.5, h: 0.6, kind: 'green' }, // P13L
  { street: 'Kellermatten', t: 'shrub', p: [-316.6, 25], r: 0.5, h: 0.6, kind: 'flowering', flower: '#8a2a3a' }, // P13L
  { street: 'Kellermatten', t: 'shrub', p: [-316.9, 27.5], r: 0.4, h: 0.5, kind: 'boxwood' }, // P13L
  { street: 'Kellermatten', t: 'shrub', p: [-317.4, 30], r: 0.6, h: 0.6, kind: 'green', color: '#c8b830' }, // P13L
  { street: 'Kellermatten', t: 'shrub', p: [-318.2, 32.5], r: 0.6, h: 0.8, kind: 'green', color: '#6a3040' }, // P13L+P12L
  { street: 'Kellermatten', t: 'shrub', p: [-315.8, 26.4], r: 1.5, h: 3, kind: 'green', color: '#4a7a35' }, // P13L+Luftbild
  { street: 'Kellermatten', t: 'hedge', pts: [[-315, 34.6], [-309, 35]], h: 1, w: 0.8, kind: 'mixed' }, // Luftbild
  { street: 'Kellermatten', t: 'shrub', p: [-329.5, 26], r: 0.5, h: 1.8, kind: 'boxwood' }, // P13R (Buchsspirale)
  { street: 'Kellermatten', t: 'shrub', p: [-328.4, 23.5], r: 0.8, h: 0.9, kind: 'green' }, // P13R+Luftbild
  { street: 'Kellermatten', t: 'shrub', p: [-330, 28.6], r: 1, h: 1.1, kind: 'green' }, // P13R+Luftbild
  // ===== Kirchstraße =====
  { street: 'Kirchstraße', t: 'wall', pts: [[-120, -60.3], [-112.6, -58.8]], h: 0.5, w: 0.3, mat: 'concrete', color: '#b8b2a6' }, // P00L+Luftbild
  { street: 'Kirchstraße', t: 'hedge', pts: [[-120.3, -61.3], [-112.8, -59.8]], h: 2, w: 1, kind: 'mixed', color: '#4a6e2c' }, // P00L+Luftbild
  { street: 'Kirchstraße', t: 'wall', pts: [[-117.5, -49.8], [-111, -48.6], [-105.5, -46.8]], h: 0.5, w: 0.3, mat: 'plaster', color: '#d8d4cc', fence: 'panel', fenceH: 0.9 }, // P00R+Luftbild
  { street: 'Kirchstraße', t: 'shrub', p: [-114, -47.6], r: 0.9, h: 1.6, kind: 'green' }, // P00R
  { street: 'Kirchstraße', t: 'shrub', p: [-108.5, -45.6], r: 1, h: 2.2, kind: 'green' }, // P00R+Luftbild
  { street: 'Kirchstraße', t: 'planter', p: [-119.6, -50.3], r: 0.3, kind: 'pot', color: '#b5562e', colors: ['#e85a2a', '#d8282a'] }, // P00R
  { street: 'Kirchstraße', t: 'wall', pts: [[-91.2, -56.8], [-90.2, -54.2]], h: 0.5, w: 0.5, mat: 'stone', color: '#a8a090' }, // P01L
  { street: 'Kirchstraße', t: 'shrub', p: [-88.4, -57.5], r: 0.5, h: 4, kind: 'conifer' }, // P01L
  { street: 'Kirchstraße', t: 'shrub', p: [-89.6, -52.6], r: 0.8, h: 1, kind: 'hydrangea', flower: '#f0efe6' }, // P01L
  { street: 'Kirchstraße', t: 'shrub', p: [-89.4, -50], r: 0.9, h: 2, kind: 'green' }, // P01L
  { street: 'Kirchstraße', t: 'shrub', p: [-85.8, -46.7], r: 0.6, h: 0.7, kind: 'grass' }, // P02L
  { street: 'Kirchstraße', t: 'shrub', p: [-84.9, -46.6], r: 0.9, h: 1.7, kind: 'flowering', flower: '#d8407a' }, // P02L (Oleander)
  { street: 'Kirchstraße', t: 'shrub', p: [-83.2, -46.2], r: 0.5, h: 1.1, kind: 'green' }, // P02L
  { street: 'Kirchstraße', t: 'planter', p: [-82.2, -46], r: 0.4, kind: 'pot', color: '#b0603a', colors: ['#5d8a3c'] }, // P02L
  { street: 'Kirchstraße', t: 'shrub', p: [-80.6, -45.8], r: 0.6, h: 0.8, kind: 'green' }, // P02L
  { street: 'Kirchstraße', t: 'shrub', p: [-78.1, -45.3], r: 0.5, h: 0.7, kind: 'green' }, // P02L
  { street: 'Kirchstraße', t: 'wall', pts: [[-92.5, -41], [-90, -39.6], [-89.6, -30.5]], h: 0.4, w: 0.3, mat: 'concrete', color: '#c4c2bc', fence: 'white', fenceH: 0.9 }, // P02R+Luftbild
  { street: 'Kirchstraße', t: 'wall', pts: [[-72.7, 0.5], [-72, 12], [-70.6, 29.5]], h: 1, w: 0.3, mat: 'concrete', color: '#c8c6be' }, // P04L+P05L+Luftbild (Stützmauer unter der Wiese)
  { street: 'Kirchstraße', t: 'wall', pts: [[-79.6, 1.5], [-79.4, 12.5]], h: 1, w: 0.3, mat: 'concrete', color: '#9e9a90' }, // P04R+Luftbild
  { street: 'Kirchstraße', t: 'shrub', p: [-80.8, 4], r: 1, h: 1.8, kind: 'green' }, // P04R+Luftbild
  { street: 'Kirchstraße', t: 'shrub', p: [-80.8, 9.5], r: 1, h: 2, kind: 'green' }, // P04R+Luftbild
  { street: 'Kirchstraße', t: 'wall', pts: [[-77.4, 20.5], [-77.2, 27]], h: 0.3, w: 0.3, mat: 'stone', color: '#9a958a', fence: 'wire', fenceH: 1 }, // P05R+Luftbild
  { street: 'Kirchstraße', t: 'hedge', pts: [[-77.6, 27.5], [-77.3, 33.8]], h: 1.5, w: 0.8, kind: 'privet' }, // P05R+Luftbild
  { street: 'Kirchstraße', t: 'hedge', pts: [[-75.8, 36.3], [-75.4, 42], [-75, 49], [-75.6, 50.4]], h: 1.3, w: 0.8, kind: 'privet', color: '#3a5a2a' }, // P06R+P07R+Luftbild
  { street: 'Kirchstraße', t: 'wall', pts: [[-74, 61.3], [-73.3, 70]], h: 0.4, w: 0.4, mat: 'granite', color: '#a9a8a2' }, // P08R+Luftbild
  { street: 'Kirchstraße', t: 'hedge', pts: [[-74.4, 61.6], [-73.7, 69.8]], h: 1.4, w: 0.7, kind: 'privet', color: '#2f4a22' }, // P08R+Luftbild
  { street: 'Kirchstraße', t: 'wall', pts: [[-73.3, 70.3], [-72.1, 77.5]], h: 0.4, w: 0.4, mat: 'granite', color: '#a9a8a2', fence: 'privacy', fenceH: 1.1 }, // P08R+Luftbild
  { street: 'Kirchstraße', t: 'shrub', p: [-76.5, 65], r: 1.4, h: 3.5, kind: 'green' }, // P08R+Luftbild
  { street: 'Kirchstraße', t: 'hedge', pts: [[-72, 79.5], [-70.1, 90], [-68.9, 95], [-70.5, 97.8], [-74, 98.6]], h: 2.2, w: 1.6, kind: 'laurel', color: '#4f7a32' }, // P08R+P09R+Luftbild
  { street: 'Kirchstraße', t: 'wall', pts: [[-43.5, 118], [-41.5, 121], [-40, 123.5]], h: 0.5, w: 0.4, mat: 'stone', color: '#9a9080' }, // P10L+Luftbild
  { street: 'Kirchstraße', t: 'planter', p: [-42.8, 119.6], kind: 'trough', color: '#7a5a3a', colors: ['#e0303a', '#f070a0'], rot: 1 }, // P10L
  { street: 'Kirchstraße', t: 'planter', p: [-41.1, 122.6], r: 0.3, kind: 'pot', color: '#b5562e', colors: ['#d02838'] }, // P10L
  { street: 'Kirchstraße', t: 'hedge', pts: [[-51, 122.4], [-48, 127.9]], h: 1, w: 0.7, kind: 'privet', color: '#35552a' }, // P10R+Luftbild
  { street: 'Kirchstraße', t: 'wall', pts: [[-46.5, 134.6], [-51.5, 131.2]], h: 0.3, w: 0.4, mat: 'stone', color: '#a39a88' }, // P11R
  { street: 'Kirchstraße', t: 'flowers', pts: [[-47.5, 133.2], [-50.5, 131.2]], h: 0.4, w: 1.4, colors: ['#7a5ab8', '#f2f0f0', '#e8c840'] }, // P11R
  { street: 'Kirchstraße', t: 'shrub', p: [-48.4, 133.8], r: 1, h: 1.6, kind: 'green' }, // P11R
  { street: 'Kirchstraße', t: 'shrub', p: [-50.8, 130.4], r: 1.2, h: 4, kind: 'conifer' }, // P11R
  { street: 'Kirchstraße', t: 'shrub', p: [-43.8, 136.2], r: 1, h: 2, kind: 'green' }, // P11R
  { street: 'Kirchstraße', t: 'shrub', p: [-43, 134.6], r: 0.6, h: 0.9, kind: 'boxwood' }, // P11R
  { street: 'Kirchstraße', t: 'shrub', p: [-30.5, 131.5], r: 1.6, h: 3, kind: 'green', color: '#4a6a28' }, // P11L+P14L+Luftbild
  { street: 'Kirchstraße', t: 'hedge', pts: [[-28, 134], [-19, 138], [-9.5, 142]], h: 2.3, w: 1.2, kind: 'conifer', color: '#4f6f30' }, // P14L+P15L+Luftbild
  // ===== Lindenhof =====
  { street: 'Lindenhof', t: 'hedge', pts: [[1137.3, -22.2], [1149.8, -22.2], [1162.8, -21.2]], h: 2.2, w: 1.8, kind: 'mixed' }, // Luftbild
  // ===== Neuweg =====
  { street: 'Neuweg', t: 'hedge', pts: [[-1028, 638.7], [-1032, 636.5], [-1036.5, 635.5], [-1039.9, 634.9]], h: 0.9, w: 0.8, kind: 'privet' }, // P00R+Luftbild
  { street: 'Neuweg', t: 'hedge', pts: [[-1020.9, 625], [-1020.6, 631.5], [-1019.4, 636]], h: 1, w: 0.8, kind: 'privet' }, // P00L+P01R
  { street: 'Neuweg', t: 'hedge', pts: [[-912.8, 670.7], [-905.8, 671.9], [-898.8, 673.1]], h: 3, w: 2, kind: 'wild' }, // P14L+P15L
  { street: 'Neuweg', t: 'hedge', pts: [[-887.7, 675.1], [-882.4, 676], [-877.1, 676.9], [-872.5, 677.4]], h: 3, w: 2, kind: 'wild' }, // P15L+P16L
  { street: 'Neuweg', t: 'shrub', p: [-902.6, 681.1], r: 0.9, h: 2, kind: 'green' }, // P14R
  { street: 'Neuweg', t: 'shrub', p: [-903.9, 680.4], r: 0.5, h: 0.8, kind: 'green' }, // P14R
  { street: 'Neuweg', t: 'shrub', p: [-904.9, 680], r: 0.5, h: 0.6, kind: 'grass', color: '#a0b060' }, // P14R
  { street: 'Neuweg', t: 'shrub', p: [-905.9, 680.3], r: 0.4, h: 1, kind: 'conifer' }, // P14R
  { street: 'Neuweg', t: 'planter', p: [-894, 684.3], r: 0.3, kind: 'pot', color: '#b5653a', colors: ['#4a7a3a'] }, // P15R
  { street: 'Neuweg', t: 'planter', p: [-894.7, 684.2], r: 0.3, kind: 'pot', color: '#b5653a', colors: ['#4a7a3a'] }, // P15R
  { street: 'Neuweg', t: 'planter', p: [-895.4, 684], r: 0.3, kind: 'pot', color: '#b5653a', colors: ['#4a7a3a'] }, // P15R
  { street: 'Neuweg', t: 'shrub', p: [-891.9, 684.2], r: 1.3, h: 2.3, kind: 'green' }, // P15R
  { street: 'Neuweg', t: 'shrub', p: [-885.1, 684], r: 0.5, h: 1.6, kind: 'conifer' }, // P16R
  { street: 'Neuweg', t: 'shrub', p: [-886.2, 684.8], r: 0.5, h: 1.4, kind: 'conifer' }, // P16R
  { street: 'Neuweg', t: 'shrub', p: [-879.2, 688], r: 1.5, h: 3, kind: 'green' }, // P16R
  { street: 'Neuweg', t: 'wall', pts: [[-927.7, 827.6], [-925.5, 832.3], [-923.2, 837.1], [-921, 841.8]], h: 0.9, w: 0.6, mat: 'stone', color: '#b5aa98', cap: false }, // P17R+Rheinblick P05L
  { street: 'Neuweg', t: 'hedge', pts: [[-928.7, 828.1], [-926.5, 832.8], [-924.2, 837.5], [-922, 842.2]], h: 2, w: 1.4, kind: 'mixed', color: '#8aa040' }, // P17R+Rheinblick P05L
  { street: 'Neuweg', t: 'fence', pts: [[-920, 844.8], [-917.7, 849.8], [-915.5, 854.9], [-915.1, 861]], h: 1, style: 'wire', color: '#5a7a4a' }, // P18R+P17R
  { street: 'Neuweg', t: 'wall', pts: [[-916.7, 833.3], [-914.2, 838.6]], h: 0.5, w: 0.4, mat: 'stone', color: '#a59c8c' }, // P17L
  { street: 'Neuweg', t: 'shrub', p: [-915.6, 834.3], r: 0.4, h: 2.5, kind: 'conifer' }, // P17L
  { street: 'Neuweg', t: 'shrub', p: [-914.9, 835.6], r: 0.4, h: 2.5, kind: 'conifer' }, // P17L
  { street: 'Neuweg', t: 'shrub', p: [-914.1, 837], r: 0.8, h: 1.5, kind: 'green' }, // P17L
  { street: 'Neuweg', t: 'shrub', p: [-912.1, 841.5], r: 0.9, h: 2, kind: 'grass', color: '#b8c050' }, // P17L
  { street: 'Neuweg', t: 'wall', pts: [[-912.8, 845.7], [-909.5, 853.1]], h: 0.4, w: 0.4, mat: 'stone', color: '#a8a090' }, // P18L
  { street: 'Neuweg', t: 'hedge', pts: [[-912.2, 845.4], [-908.9, 852.8]], h: 2.5, w: 1.2, kind: 'bamboo' }, // P18L
  { street: 'Neuweg', t: 'fence', pts: [[-910.5, 845.5], [-908, 851.1]], h: 2, style: 'privacy', color: '#b8a070' }, // P18L
  { street: 'Neuweg', t: 'wall', pts: [[-908.9, 854.3], [-908.8, 860.9]], h: 0.8, w: 0.4, mat: 'stone', color: '#bdb6a8' }, // P18L+Am Sonnenrain P01R
  { street: 'Neuweg', t: 'shrub', p: [-907.7, 856], r: 0.6, h: 1.2, kind: 'grass', color: '#c8b878' }, // P18L+Am Sonnenrain P01R
  { street: 'Neuweg', t: 'shrub', p: [-907.8, 858.9], r: 0.6, h: 1.2, kind: 'grass', color: '#c8b878' }, // P18L+Am Sonnenrain P01R
  { street: 'Neuweg', t: 'shrub', p: [-906.9, 857.5], r: 0.9, h: 1.5, kind: 'green' }, // Am Sonnenrain P01R
  // ===== Ob_der_Schmiede =====
  // ===== Probsteiweg =====
  { street: 'Probsteiweg', t: 'flowers', pts: [[-205, 75.3], [-200.5, 76.3]], h: 0.3, w: 1, colors: ['#f0f0f8', '#e070b0', '#9070d0', '#f2d040'] }, // P00L
  { street: 'Probsteiweg', t: 'shrub', p: [-201.8, 76], r: 0.8, h: 2.5, kind: 'green' }, // P00L
  { street: 'Probsteiweg', t: 'wall', pts: [[-208.3, 80], [-201.3, 83.1], [-196.3, 85.3], [-171.5, 93.1], [-151.2, 99.4]], h: 1.5, w: 0.5, mat: 'stone', color: '#a39b8c', capColor: '#9a9a92' }, // P00R+P01R+P02R+P03R+Luftbild
  { street: 'Probsteiweg', t: 'hedge', pts: [[-208, 80.8], [-201, 83.9], [-196, 86.1], [-171.3, 93.9], [-151, 100.2]], h: 2.2, w: 1, kind: 'ivy' }, // P00R+P01R+P02R+P03R (Efeu und Gebüsch hinter der Mauer)
  { street: 'Probsteiweg', t: 'flowers', pts: [[-207.6, 79.3], [-200.9, 82.4], [-195.9, 84.6], [-180, 89.6]], h: 0.3, w: 0.4, colors: ['#f2d02a', '#5a8a3a'] }, // P00R+P01R (Narzissen am Mauerfuß)
  { street: 'Probsteiweg', t: 'shrub', p: [-184, 80.8], r: 1.5, h: 3, kind: 'green' }, // P01L
  { street: 'Probsteiweg', t: 'fence', pts: [[-185.5, 81.6], [-181.8, 82.9]], h: 1.8, style: 'privacy', color: '#b8a878' }, // P01L (Bambusrohrzaun)
  { street: 'Probsteiweg', t: 'wall', pts: [[-181.5, 83], [-170, 86.6], [-157.4, 89.2]], h: 1.1, w: 0.4, mat: 'stone', color: '#a8a49a' }, // P01L+P02L+Luftbild
  { street: 'Probsteiweg', t: 'hedge', pts: [[-181.3, 82.3], [-170, 85.9], [-157.6, 88.5]], h: 2.3, w: 1, kind: 'yew' }, // P01L+P02L+Luftbild
  { street: 'Probsteiweg', t: 'planter', p: [-131.8, 100.3], r: 0.4, kind: 'barrel', colors: ['#d84040', '#5a8a3a'] }, // P03L
  { street: 'Probsteiweg', t: 'planter', p: [-132.8, 100], r: 0.3, kind: 'pot', color: '#b5562e', colors: ['#d82838'] }, // P03L
  { street: 'Probsteiweg', t: 'wall', pts: [[-120.9, 114.6], [-124.2, 118.6]], h: 0.3, w: 0.3, mat: 'concrete', color: '#a8c8a0' }, // P04R (Beet vor dem Marienheim)
  { street: 'Probsteiweg', t: 'flowers', pts: [[-121.6, 115.1], [-124.7, 118.9]], h: 0.3, w: 1.4, colors: ['#d080c0', '#b070d0'] }, // P04R (Polsterphlox)
  { street: 'Probsteiweg', t: 'shrub', p: [-123.6, 117.4], r: 1.6, h: 4, kind: 'flowering', flower: '#f0d8e0' }, // P04R
  { street: 'Probsteiweg', t: 'wall', pts: [[-107, 105.4], [-97.5, 105.4]], h: 0.6, w: 0.4, mat: 'stone', color: '#8f8a7c', fence: 'metal', fenceH: 0.8 }, // P05R (efeuüberwachsene Mauer mit rostigem Geländer)
  { street: 'Probsteiweg', t: 'shrub', p: [-101.5, 99.6], r: 1.6, h: 2.6, kind: 'green', color: '#5a8a30' }, // P05L+Luftbild (Kirschlorbeer)
  { street: 'Probsteiweg', t: 'hedge', pts: [[-74, 98.6], [-82, 98.9], [-90, 99]], h: 2, w: 1.4, kind: 'laurel', color: '#6a9a38' }, // P05L+P06L+Luftbild
  { street: 'Probsteiweg', t: 'shrub', p: [-73.5, 94], r: 1.8, h: 3.8, kind: 'flowering', flower: '#a080d0' }, // P05L+P06L (Flieder)
  { street: 'Probsteiweg', t: 'wall', pts: [[-80.4, 104.8], [-79.6, 107.4]], h: 0.4, w: 0.4, mat: 'stone', color: '#8f8a7c', fence: 'metal', fenceH: 0.8 }, // P06R
  { street: 'Probsteiweg', t: 'shrub', p: [-78.5, 108], r: 2, h: 3.5, kind: 'green' }, // P06R+Luftbild
  // ===== Quellenhof =====
  { street: 'Quellenhof', t: 'fence', pts: [[1109.6, -150], [1109.6, -142], [1111, -140.2], [1117, -139.4]], h: 1, style: 'wire', color: '#8a8070' }, // P00L (Pfosten mit Draht, Obstwiese)
  { street: 'Quellenhof', t: 'planter', p: [1111.6, -139.8], r: 0.5, kind: 'trough', color: '#6e4f35', colors: ['#d0508a', '#e07aa8'], rot: 0.1 }, // P00L (Kasten unter Hofschild)
  // ===== Rathausstraße =====
  { street: 'Rathausstraße', t: 'hedge', pts: [[-59.8, -42.3], [-54, -42.8], [-48, -43.2]], h: 1.3, w: 0.9, kind: 'laurel', color: '#3e6a2a' }, // P00L+P01L+Luftbild (Kirschlorbeer vor der Wiese)
  { street: 'Rathausstraße', t: 'fence', pts: [[-40, -44], [-33.5, -44.4]], h: 1, style: 'wire', color: '#5a6a50' }, // P02L
  { street: 'Rathausstraße', t: 'hedge', pts: [[-33, -44.5], [-26, -45], [-22.6, -46.5], [-21.8, -49.5]], h: 1.8, w: 1, kind: 'privet' }, // P02L+Luftbild
  { street: 'Rathausstraße', t: 'wall', pts: [[-34, -36.1], [-23.5, -37]], h: 0.6, w: 0.3, mat: 'concrete', color: '#b4b0a6' }, // P02R+Luftbild
  { street: 'Rathausstraße', t: 'hedge', pts: [[-34, -35.4], [-23.5, -36.3]], h: 1.6, w: 0.8, kind: 'privet' }, // P02R
  { street: 'Rathausstraße', t: 'shrub', p: [-24.5, -35.6], r: 0.5, h: 1, kind: 'rose', flower: '#e05090' }, // P02R
  { street: 'Rathausstraße', t: 'wall', pts: [[-13.3, -51.5], [-12.8, -46.3], [0, -47.6]], h: 0.5, w: 0.3, mat: 'concrete', color: '#bcb6a8' }, // P02L+P03L (Hochbeet an der Hausecke)
  { street: 'Rathausstraße', t: 'flowers', pts: [[-12.4, -50.5], [-12, -47.1], [-1, -48.3]], h: 0.4, w: 1, colors: ['#e03040', '#f08030', '#e070a0', '#9a60c0', '#f0f0f0'] }, // P03L
  { street: 'Rathausstraße', t: 'shrub', p: [-9.5, -49], r: 1.3, h: 2.5, kind: 'green' }, // P03L (Formschnitt-Kugel)
  { street: 'Rathausstraße', t: 'shrub', p: [-11.6, -49.6], r: 1.1, h: 2.2, kind: 'green' }, // P03L
  { street: 'Rathausstraße', t: 'shrub', p: [-5, -48.7], r: 0.6, h: 0.9, kind: 'green' }, // P03L
  { street: 'Rathausstraße', t: 'shrub', p: [-2.5, -48.9], r: 0.5, h: 0.8, kind: 'green' }, // P03L
  { street: 'Rathausstraße', t: 'wall', pts: [[3.5, -36], [7.5, -36.4]], h: 0.4, w: 0.3, mat: 'concrete', color: '#c0bcb2' }, // P03R
  { street: 'Rathausstraße', t: 'flowers', pts: [[3.5, -35.4], [7.5, -35.8]], h: 0.4, w: 0.8, colors: ['#d82030'] }, // P03R
  { street: 'Rathausstraße', t: 'hedge', pts: [[8.5, -36.5], [11.5, -36.8]], h: 2, w: 1, kind: 'thuja' }, // P03R+Luftbild
  { street: 'Rathausstraße', t: 'fence', pts: [[4, -47.6], [11.5, -48.4]], h: 1.1, style: 'wood', color: '#9a5a3a' }, // P04L
  { street: 'Rathausstraße', t: 'hedge', pts: [[20, -49.4], [26.5, -51], [33, -52.6], [38, -54], [44.5, -55.6]], h: 1, w: 0.7, kind: 'privet' }, // P04L+P05L+Luftbild
  { street: 'Rathausstraße', t: 'shrub', p: [37.5, -56], r: 1.5, h: 3, kind: 'green' }, // P05L
  { street: 'Rathausstraße', t: 'shrub', p: [42.5, -56.5], r: 1, h: 2, kind: 'green' }, // P05L
  { street: 'Rathausstraße', t: 'hedge', pts: [[17.5, -42.6], [22.5, -43]], h: 0.7, w: 0.8, kind: 'privet' }, // P04R
  { street: 'Rathausstraße', t: 'shrub', p: [24, -42.8], r: 1, h: 1.5, kind: 'green' }, // P04R
  { street: 'Rathausstraße', t: 'shrub', p: [44.5, -46.5], r: 1.4, h: 1.5, kind: 'green' }, // P05R+Luftbild
  { street: 'Rathausstraße', t: 'wall', pts: [[47.5, -58], [47.8, -62.5]], h: 0.6, w: 0.8, mat: 'limestone', color: '#d0c8b4' }, // P06L (Kalksteinblöcke)
  { street: 'Rathausstraße', t: 'shrub', p: [66, -52], r: 1.5, h: 1.8, kind: 'green' }, // P06R+Luftbild
  { street: 'Rathausstraße', t: 'shrub', p: [68.5, -52.5], r: 0.8, h: 3.5, kind: 'conifer' }, // P06R
  { street: 'Rathausstraße', t: 'shrub', p: [75.5, -54], r: 1.3, h: 2.2, kind: 'green' }, // P07R+Luftbild (Verkehrsinsel)
  { street: 'Rathausstraße', t: 'shrub', p: [76.5, -52.5], r: 0.6, h: 0.8, kind: 'grass' }, // P07R
  // ===== Rheinblick =====
  { street: 'Rheinblick', t: 'shrub', p: [-883.7, 731.4], r: 0.9, h: 3, kind: 'conifer', color: '#2f5a35' }, // P00L
  { street: 'Rheinblick', t: 'shrub', p: [-884, 731.9], r: 0.5, h: 0.6, kind: 'green' }, // P00L
  { street: 'Rheinblick', t: 'shrub', p: [-883.2, 734.5], r: 0.5, h: 0.6, kind: 'green' }, // P00L
  { street: 'Rheinblick', t: 'shrub', p: [-884.1, 737.1], r: 0.6, h: 0.6, kind: 'green', color: '#7a4a3a' }, // P00L
  { street: 'Rheinblick', t: 'wall', pts: [[-888.2, 727.7], [-878, 725.8]], h: 0.6, w: 0.3, mat: 'concrete', color: '#9a9a98' }, // P00L
  { street: 'Rheinblick', t: 'wall', pts: [[-884.8, 756], [-886.2, 761.4], [-887.6, 766.7], [-888.9, 772]], h: 0.5, w: 0.7, mat: 'stone', color: '#a8a294', cap: false }, // P01L
  { street: 'Rheinblick', t: 'fence', pts: [[-885.2, 759.9], [-886.7, 765.7], [-888.1, 771.4]], h: 1.1, style: 'privacy', color: '#55595d' }, // P01L+P02L
  { street: 'Rheinblick', t: 'hedge', pts: [[-884.1, 760.2], [-885.6, 765.9], [-887.1, 771.6]], h: 2.2, w: 1.4, kind: 'mixed' }, // P01L+P02L
  { street: 'Rheinblick', t: 'shrub', p: [-884.2, 757.1], r: 0.5, h: 1, kind: 'grass', color: '#b8b080' }, // P01L
  { street: 'Rheinblick', t: 'shrub', p: [-884.5, 758.5], r: 0.6, h: 1.2, kind: 'green' }, // P01L
  { street: 'Rheinblick', t: 'planter', p: [-904.9, 787], r: 0.3, kind: 'pot', color: '#a85a3a', colors: ['#e0406a'] }, // P03R
  { street: 'Rheinblick', t: 'planter', p: [-905.3, 788.4], r: 0.3, kind: 'pot', color: '#6a6a6a', colors: ['#f2f2f2'] }, // P03R
  { street: 'Rheinblick', t: 'shrub', p: [-903.5, 791.6], r: 0.5, h: 0.6, kind: 'boxwood' }, // P03R
  { street: 'Rheinblick', t: 'wall', pts: [[-896.8, 800.3], [-901.1, 808.3], [-905, 812.5]], h: 0.7, w: 0.3, mat: 'granite', color: '#bdbab3' }, // P04L+P03L
  { street: 'Rheinblick', t: 'wall', pts: [[-894.4, 801.4], [-898.7, 809.7], [-902.4, 813.6]], h: 1.6, w: 0.5, mat: 'gabion', cap: false }, // P04L+P03L
  { street: 'Rheinblick', t: 'hedge', pts: [[-893.6, 801.7], [-898.2, 810.2], [-901.8, 814.1]], h: 1.5, w: 1, kind: 'laurel' }, // P04L+P03L
  { street: 'Rheinblick', t: 'wall', pts: [[-905.8, 813.2], [-911.5, 815.9], [-917.3, 818.1]], h: 0.3, w: 0.2, mat: 'granite', color: '#bdbab3' }, // P04L
  { street: 'Rheinblick', t: 'hedge', pts: [[-905.4, 813.5], [-911.3, 816.4], [-917.1, 818.6]], h: 1.3, w: 0.9, kind: 'laurel' }, // P04L+Luftbild
  { street: 'Rheinblick', t: 'hedge', pts: [[-907.9, 805.7], [-913.4, 809.5]], h: 2, w: 1.2, kind: 'conifer', color: '#3d5e34' }, // P04R
  { street: 'Rheinblick', t: 'planter', p: [-908.8, 804.3], r: 0.3, kind: 'pot', color: '#3c3c3c', colors: ['#d8d0a0'] }, // P04R
  { street: 'Rheinblick', t: 'planter', p: [-909.9, 805.3], r: 0.3, kind: 'pot', color: '#3c3c3c', colors: ['#d8d0a0'] }, // P04R
  { street: 'Rheinblick', t: 'planter', p: [-911, 806.3], r: 0.3, kind: 'pot', color: '#3c3c3c', colors: ['#d8d0a0'] }, // P04R
  { street: 'Rheinblick', t: 'hedge', pts: [[-917.3, 810.8], [-923.2, 813], [-927, 814.4]], h: 2.5, w: 1.6, kind: 'mixed' }, // P05R+Luftbild
  // ===== Rheinstraße =====
  { street: 'Rheinstraße', t: 'hedge', pts: [[215.9, -1199.4], [208.6, -1189.5], [201.5, -1180.4]], h: 2.2, w: 1.5, kind: 'mixed' }, // Luftbild
  { street: 'Rheinstraße', t: 'hedge', pts: [[198.9, -1178.1], [191.1, -1170.9], [183.7, -1163.3]], h: 2.2, w: 1.5, kind: 'mixed' }, // Luftbild
  { street: 'Rheinstraße', t: 'shrub', p: [179.6, -1157.4], r: 1.8, h: 3.2, kind: 'green', color: '#3f6a2c' }, // P02L (Kirschlorbeer)
  { street: 'Rheinstraße', t: 'hedge', pts: [[178, -1153], [169.8, -1144.7], [161.6, -1136.4], [158.1, -1131.9]], h: 0.9, w: 0.8, kind: 'privet', color: '#4a6b30' }, // P02L+P03L+Luftbild
  { street: 'Rheinstraße', t: 'shrub', p: [168.2, -1140.3], r: 0.9, h: 1.5, kind: 'green', color: '#7fa34a' }, // P03L
  { street: 'Rheinstraße', t: 'hedge', pts: [[157.7, -1130.6], [155.6, -1127.8]], h: 2.5, w: 1.2, kind: 'laurel' }, // P03L
  { street: 'Rheinstraße', t: 'hedge', pts: [[149.8, -1126.4], [146.1, -1121.5], [143.1, -1116.5]], h: 4, w: 1.5, kind: 'thuja', color: '#3e6230' }, // P04L+Luftbild
  { street: 'Rheinstraße', t: 'hedge', pts: [[142.1, -1114.8], [138.8, -1109.2], [135.7, -1103.9]], h: 1.8, w: 1.2, kind: 'laurel', color: '#3d5f28', flower: '#efeedd' }, // P05L+Luftbild
  { street: 'Rheinstraße', t: 'shrub', p: [137.5, -1100.5], r: 1.2, h: 2, kind: 'flowering', color: '#4b5e33', flower: '#e8436a' }, // P05L+Luftbild (Rhododendron)
  { street: 'Rheinstraße', t: 'hedge', pts: [[132.3, -1085.5], [125.3, -1085.5], [125, -1079]], h: 1.3, w: 0.7, kind: 'hornbeam', color: '#4d7a2e' }, // P06L+Luftbild (Spalierhecke)
  { street: 'Rheinstraße', t: 'wall', pts: [[132.1, -1086.3], [129.8, -1086.6], [128.3, -1087.1]], h: 0.6, w: 0.3, mat: 'concrete', color: '#cfcac0', cap: false }, // P06L (Palisaden)
  { street: 'Rheinstraße', t: 'shrub', p: [129.5, -1082.5], r: 0.8, h: 4, kind: 'conifer', color: '#2f5230' }, // P06L+Luftbild
  { street: 'Rheinstraße', t: 'shrub', p: [119, -1072.5], r: 0.5, h: 4.5, kind: 'conifer', color: '#3a5a2a' }, // P00L (Säulenzypresse)
  // ===== Rotbergerstraße =====
  { street: 'Rotbergerstraße', t: 'wall', pts: [[-1622.4, 745.3], [-1617.7, 740.1], [-1613, 734.9], [-1608.3, 729.7]], h: 2.8, w: 0.5, mat: 'sandstone', color: '#8c8270', cap: false }, // P09R+P10R+Luftbild
  { street: 'Rotbergerstraße', t: 'wall', pts: [[-1608.3, 729.7], [-1603.5, 724.4], [-1598.7, 719.1], [-1593.7, 714.4], [-1588.5, 709.5], [-1583.4, 704.5], [-1578.2, 699.6], [-1573.7, 695.9], [-1569, 692.1], [-1564.3, 688.2], [-1559.6, 684.4], [-1554.6, 681], [-1549.4, 677.5], [-1544.3, 673.9]], h: 3.8, w: 0.5, mat: 'sandstone', color: '#857a68', cap: false }, // P11R-P14R
  { street: 'Rotbergerstraße', t: 'shrub', p: [-1622.9, 746.2], r: 0.6, h: 1, kind: 'green' }, // P09R
  { street: 'Rotbergerstraße', t: 'wall', pts: [[-1593.5, 703.7], [-1588.4, 698.9], [-1583.4, 694.1], [-1578.5, 690.1], [-1573.8, 686.2], [-1569.1, 682.4], [-1564.4, 678.5], [-1558.1, 674.3], [-1552.2, 670.2], [-1546.3, 666.2], [-1540.4, 662.2]], h: 1, w: 0.4, mat: 'concrete', color: '#9c978c' }, // P11L-P14L
  { street: 'Rotbergerstraße', t: 'wall', pts: [[-1540, 663.1], [-1533.7, 658.4], [-1527.4, 653.8], [-1521.1, 649.2], [-1514.8, 644.5], [-1508.4, 639.9]], h: 1, w: 0.4, mat: 'concrete', color: '#9c978c' }, // P19R+P20L+P21L
  { street: 'Rotbergerstraße', t: 'wall', pts: [[-1520.5, 679.6], [-1521.9, 678.9], [-1525.5, 675.4], [-1529.7, 671.5], [-1534.1, 665.7], [-1528.6, 661.6], [-1523, 657.5]], h: 0.5, w: 0.4, mat: 'stone', color: '#7d7466', cap: false, fence: 'wire', fenceH: 1.2 }, // P18R+P19R+P20R+Luftbild
  { street: 'Rotbergerstraße', t: 'wall', pts: [[-1523, 657.5], [-1517.6, 653.5], [-1512.3, 649.6], [-1506.9, 645.6]], h: 1.3, w: 0.5, mat: 'stone', color: '#80786a', cap: false, fence: 'privacy', fenceH: 1 }, // P20R+P21R
  { street: 'Rotbergerstraße', t: 'wall', pts: [[-1506.9, 645.6], [-1501.8, 641.9], [-1496.7, 638.1], [-1491.6, 634.4]], h: 2.2, w: 0.5, mat: 'sandstone', color: '#8a8070', cap: false }, // P21R+P22R
  { street: 'Rotbergerstraße', t: 'shrub', p: [-1527.3, 661.8], r: 0.7, h: 1.6, kind: 'rose', flower: '#c8202a' }, // P20R
  { street: 'Rotbergerstraße', t: 'shrub', p: [-1524.4, 659.7], r: 0.7, h: 1.6, kind: 'rose', flower: '#c8202a' }, // P20R
  { street: 'Rotbergerstraße', t: 'shrub', p: [-1522.4, 658.2], r: 0.7, h: 1.6, kind: 'rose', flower: '#c8202a' }, // P20R
  { street: 'Rotbergerstraße', t: 'shrub', p: [-1520.9, 678.5], r: 0.7, h: 1.4, kind: 'rose', flower: '#d0405a' }, // P18R
  { street: 'Rotbergerstraße', t: 'shrub', p: [-1521.3, 678.3], r: 0.6, h: 1.2, kind: 'green', color: '#a9b84a' }, // P18R
  { street: 'Rotbergerstraße', t: 'shrub', p: [-1522.5, 677.1], r: 0.6, h: 1.2, kind: 'rose', flower: '#b82030' }, // P18R
  { street: 'Rotbergerstraße', t: 'hedge', pts: [[-1509.2, 692.2], [-1512, 691.4], [-1516.9, 689.1], [-1520.9, 687], [-1525, 684.9], [-1530.1, 680.4], [-1534.4, 676.4], [-1537.1, 673]], h: 2.5, w: 1.2, kind: 'ivy' }, // P18L+P19L+P17R+Luftbild
  { street: 'Rotbergerstraße', t: 'wall', pts: [[-1472.4, 666.3], [-1476.7, 669.9], [-1480.9, 673.5]], h: 1.1, w: 0.4, mat: 'stone', color: '#8a8478', cap: false }, // P16R+P15R+Luftbild
  { street: 'Rotbergerstraße', t: 'planter', p: [-1460.4, 667], r: 0.6, kind: 'trough', color: '#8a8580', colors: ['#c8283c', '#f2f0ea', '#c8283c'] }, // P15L
  { street: 'Rotbergerstraße', t: 'planter', p: [-1460.3, 670.2], r: 0.6, kind: 'trough', color: '#8a8580', colors: ['#c8283c', '#f2f0ea', '#c8283c'] }, // P15L
  { street: 'Rotbergerstraße', t: 'wall', pts: [[-1475.5, 623.4], [-1471, 624], [-1466, 624.6]], h: 0.8, w: 0.8, mat: 'limestone', color: '#b8ab94', cap: false }, // P00R+Luftbild
  { street: 'Rotbergerstraße', t: 'hedge', pts: [[-1407, 568.5], [-1401, 566.3], [-1395, 564]], h: 1.5, w: 1.5, kind: 'mixed' }, // P04R+Luftbild
  { street: 'Rotbergerstraße', t: 'fence', pts: [[-1385.7, 551.1], [-1379.3, 546.5], [-1372.9, 541.8], [-1366.6, 538.8], [-1359.8, 535.4], [-1353, 532.1], [-1346.2, 528.8], [-1346.1, 528.8]], h: 1.2, style: 'wire', color: '#7a6a52' }, // P05R+P06R+Luftbild
  // ===== Römerstraße =====
  { street: 'Römerstraße', t: 'planter', p: [-280.5, 201], r: 0.4, kind: 'pot', color: '#9a8f84', colors: ['#e8709c', '#f2eef0'] }, // P05R
  { street: 'Römerstraße', t: 'shrub', p: [-272.3, 205.2], r: 1.1, h: 1.6, kind: 'green', color: '#5f7d3a' }, // P05L+Luftbild
  { street: 'Römerstraße', t: 'shrub', p: [-290.5, 216.4], r: 0.5, h: 0.8, kind: 'grass', color: '#7d9585' }, // P06R (Agave im Steintopf)
  { street: 'Römerstraße', t: 'shrub', p: [-311.3, 274.3], r: 0.6, h: 4, kind: 'conifer', color: '#2f4a2a' }, // P09R+P10R+Luftbild
  { street: 'Römerstraße', t: 'shrub', p: [-315.7, 282.8], r: 0.6, h: 4, kind: 'conifer', color: '#2f4a2a' }, // P09R+P10R+Luftbild
  { street: 'Römerstraße', t: 'shrub', p: [-319.1, 289.3], r: 0.6, h: 4, kind: 'conifer', color: '#2f4a2a' }, // P09R+P10R+Luftbild
  { street: 'Römerstraße', t: 'shrub', p: [-312.6, 277.3], r: 0.5, h: 0.8, kind: 'boxwood', color: '#3f5f2e' }, // P09R
  { street: 'Römerstraße', t: 'shrub', p: [-314.7, 280.8], r: 0.5, h: 0.9, kind: 'conifer', color: '#3a5a32' }, // P10R
  { street: 'Römerstraße', t: 'shrub', p: [-320.8, 292.3], r: 0.6, h: 0.7, kind: 'green', color: '#4a6a35' }, // P10R
  { street: 'Römerstraße', t: 'fence', pts: [[-301.6, 277.6], [-295.7, 285.7]], h: 1.7, style: 'privacy', color: '#5a4f46' }, // P00R+P09L+P10L
  { street: 'Römerstraße', t: 'wall', pts: [[-305.6, 279.2], [-308, 285], [-310.2, 290.9]], h: 0.6, w: 0.5, mat: 'stone', color: '#8d8578', cap: false }, // P00R+P10L (Findlingssteine)
  { street: 'Römerstraße', t: 'shrub', p: [-310.3, 292.9], r: 1.4, h: 2.8, kind: 'green', color: '#5d7a3a' }, // P10L
  { street: 'Römerstraße', t: 'shrub', p: [-311, 296], r: 1.5, h: 3, kind: 'green', color: '#4f6f33' }, // P10L+P00R
  { street: 'Römerstraße', t: 'hedge', pts: [[-287.2, 297.5], [-283, 303.2]], h: 2.5, w: 1.5, kind: 'mixed' }, // P09L+Luftbild
  { street: 'Römerstraße', t: 'hedge', pts: [[-314, 304.3], [-317.2, 314.3], [-320.7, 325.1]], h: 3.2, w: 2.5, kind: 'wild', flower: '#b9a2d6' }, // P11L+P12L (Flieder, Schneeball)
  { street: 'Römerstraße', t: 'hedge', pts: [[-320.7, 325.1], [-327.1, 345], [-333.5, 364.8], [-339.9, 384.7], [-346.3, 404.6], [-352.7, 424.8], [-359, 442.2]], h: 3, w: 2.5, kind: 'wild' }, // P13L+P14L+Luftbild
  { street: 'Römerstraße', t: 'fence', pts: [[-368.8, 477.2], [-372.3, 480]], h: 1.5, style: 'wood', color: '#8a7d6c' }, // P15L
  { street: 'Römerstraße', t: 'hedge', pts: [[-375.4, 481.4], [-379.6, 491.3], [-383.8, 501.2], [-388.9, 509.9]], h: 2.8, w: 2.5, kind: 'wild' }, // P15L+P16L+P17L+Luftbild
  { street: 'Römerstraße', t: 'hedge', pts: [[-388.9, 509.9], [-401.4, 531.2], [-413.2, 551.3], [-422.7, 566.6], [-432.3, 581.1]], h: 3, w: 2.5, kind: 'wild' }, // Luftbild+P17L
  { street: 'Römerstraße', t: 'hedge', pts: [[-319.3, 296.8], [-324.5, 295.1]], h: 1, w: 1, kind: 'mixed' }, // P11R+Luftbild
  { street: 'Römerstraße', t: 'flowers', p: [-319.9, 298.6], r: 0.5, h: 0.4, colors: ['#e889b5', '#f5c2d8'] }, // P11R
  { street: 'Römerstraße', t: 'shrub', p: [-324.6, 302], r: 0.9, h: 2, kind: 'flowering', color: '#8a4b3c' }, // P11R (Glanzmispel)
  { street: 'Römerstraße', t: 'planter', p: [-326, 304.3], r: 0.3, kind: 'pot', color: '#5e5a55', colors: ['#d63a4a', '#f08cb0'] }, // P11R
  { street: 'Römerstraße', t: 'planter', p: [-326.7, 303.4], r: 0.3, kind: 'pot', color: '#5e5a55', colors: ['#8e5cc0'] }, // P11R
  { street: 'Römerstraße', t: 'flowers', p: [-327.3, 313.7], r: 0.8, h: 0.3, colors: ['#f4f4f0', '#e9e2f2'] }, // P11R
  { street: 'Römerstraße', t: 'shrub', p: [-327.3, 315.6], r: 0.4, h: 2.2, kind: 'conifer', color: '#2f4a2a' }, // P11R
  { street: 'Römerstraße', t: 'shrub', p: [-326.6, 317.2], r: 0.8, h: 1.3, kind: 'green', color: '#9bb04a' }, // P11R
  { street: 'Römerstraße', t: 'hedge', pts: [[-326.9, 318.6], [-333.1, 338], [-339.5, 357.8], [-340.9, 362]], h: 2.2, w: 1.2, kind: 'laurel', color: '#3d5a2b' }, // P11R+P12R+P13R+P14R+Luftbild
  { street: 'Römerstraße', t: 'fence', pts: [[-401, 502.7], [-399.4, 501]], h: 1.1, style: 'wood', color: '#4f4740' }, // P17R
  // ===== Salzbrunnenstraße =====
  { street: 'Salzbrunnenstraße', t: 'hedge', pts: [[-21.1, -46.3], [-20, -55.2], [-28, -55.6]], h: 1.4, w: 0.9, kind: 'privet', color: '#3f5f2a' }, // P00L+Luftbild
  { street: 'Salzbrunnenstraße', t: 'wall', pts: [[-12.1, -55.6], [-13.5, -48.5], [-10, -47.4]], h: 0.9, w: 0.4, mat: 'concrete', color: '#c8c2b2' }, // P00R+Luftbild
  { street: 'Salzbrunnenstraße', t: 'flowers', pts: [[-11.9, -55.2], [-12.8, -49]], h: 0.4, w: 1.2, colors: ['#d83020', '#f08a20', '#f2d43a', '#f4f4f4', '#e890b8'] }, // P00R
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [-11.4, -53.6], r: 1.2, h: 2, kind: 'green', color: '#4a7a35' }, // P00R+Luftbild
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [-11.2, -51.2], r: 1, h: 1.8, kind: 'green', color: '#7a3a3a' }, // P00R
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [-11.5, -49], r: 1.2, h: 2, kind: 'green', color: '#557f3a' }, // P00R+Luftbild
  { street: 'Salzbrunnenstraße', t: 'planter', p: [-12.2, -47.6], r: 0.5, kind: 'trough', color: '#5a5a50', colors: ['#e890b8', '#f4f4f4', '#d84a7a'], rot: 0.3 }, // P00R
  { street: 'Salzbrunnenstraße', t: 'wall', pts: [[-20, -70.2], [-14.5, -70.7], [-12.6, -82]], h: 1, w: 0.3, mat: 'plaster', color: '#ecebe4', capColor: '#f4f4f0' }, // P01L+Luftbild
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [-16, -79], r: 1.6, h: 2.5, kind: 'green', color: '#4a7a35' }, // P01L+Luftbild
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [-14.4, -81], r: 1, h: 1.8, kind: 'green' }, // P01L+Luftbild
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [-15.4, -73.4], r: 0.6, h: 0.9, kind: 'rose', flower: '#c0405a' }, // P01L
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [-17, -74.5], r: 0.5, h: 0.8, kind: 'green' }, // P01L
  { street: 'Salzbrunnenstraße', t: 'flowers', p: [-7.2, -74.6], r: 0.5, h: 0.3, colors: ['#e870a0', '#d84a7a'] }, // P01R
  { street: 'Salzbrunnenstraße', t: 'wall', pts: [[-5.8, -80], [-4, -85.8], [-1.8, -91.5], [0.4, -97.1]], h: 0.9, w: 0.4, mat: 'stone', color: '#8a7f70', capColor: '#3a3a3a' }, // P02R+P01R+Luftbild (Bollensteinmauer)
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [-4.2, -83.8], r: 1, h: 2, kind: 'boxwood' }, // P01R+Luftbild
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [-3.1, -86.3], r: 1.3, h: 1.8, kind: 'green' }, // Luftbild+P01R
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [-2, -89.3], r: 1.2, h: 1, kind: 'green', color: '#4f7a35' }, // P02R
  { street: 'Salzbrunnenstraße', t: 'flowers', pts: [[-2.9, -87.9], [-1.1, -92.6]], h: 0.3, w: 1.2, colors: ['#b8c0b0', '#c8cec0'] }, // P02R (Woll-Ziest)
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [-1, -91.6], r: 0.7, h: 1.2, kind: 'boxwood' }, // P02R
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [-0.2, -94.5], r: 1, h: 3, kind: 'conifer', color: '#2f4a2a' }, // P02R+Luftbild
  { street: 'Salzbrunnenstraße', t: 'fence', pts: [[-12.3, -104], [-6.4, -102.2], [-6.2, -106]], h: 1, style: 'metal', color: '#3a3a3a' }, // P02L+Luftbild
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [-0.8, -118.5], r: 1, h: 1.5, kind: 'green', color: '#a8b850' }, // P03L
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [1.5, -121.2], r: 2, h: 3, kind: 'green', color: '#5a8a35' }, // P03L+Luftbild
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [4.5, -127.2], r: 2, h: 3.2, kind: 'green', color: '#3f6a2e' }, // P04L+Luftbild
  { street: 'Salzbrunnenstraße', t: 'hedge', pts: [[6.4, -128.2], [8.2, -130.5]], h: 0.6, w: 0.6, kind: 'boxwood' }, // P04L
  { street: 'Salzbrunnenstraße', t: 'flowers', pts: [[12.5, -119.5], [14.5, -123.5]], h: 0.5, w: 0.6, colors: ['#5a7a3a', '#e05050'] }, // P03R+P04R
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [19.5, -131.5], r: 0.8, h: 2, kind: 'conifer', color: '#2f4a2a' }, // P04R
  { street: 'Salzbrunnenstraße', t: 'hedge', pts: [[12.8, -134.1], [15.9, -139.7], [19.6, -146.2], [23, -152.1]], h: 1.6, w: 1, kind: 'privet', color: '#3a5a2a' }, // P05L+P04L+Luftbild
  { street: 'Salzbrunnenstraße', t: 'hedge', pts: [[24.2, -138.6], [27.1, -143.7], [29.4, -147.8], [31, -150.5]], h: 3, w: 3, kind: 'wild' }, // P05R+Am Buck P04L/R+Luftbild
  { street: 'Salzbrunnenstraße', t: 'hedge', pts: [[31.7, -163.8], [34.2, -167.6]], h: 2.2, w: 1.2, kind: 'ivy', color: '#4a6a30' }, // P06L+Luftbild (Weinrebe an Pergola)
  { street: 'Salzbrunnenstraße', t: 'planter', p: [31.5, -163.2], kind: 'pot', color: '#2a4fa0', colors: ['#4a7a35'] }, // P06L
  { street: 'Salzbrunnenstraße', t: 'planter', p: [33.2, -165], kind: 'pot', color: '#2a4fa0', colors: ['#4a7a35'] }, // P06L
  { street: 'Salzbrunnenstraße', t: 'planter', p: [34.4, -166.6], kind: 'pot', color: '#2a4fa0', colors: ['#5a8a3a'] }, // P06L
  { street: 'Salzbrunnenstraße', t: 'fence', pts: [[35, -168.2], [37, -171.5]], h: 0.9, style: 'picket', color: '#7a5a3a' }, // P06L
  { street: 'Salzbrunnenstraße', t: 'wall', pts: [[49.5, -180.2], [51.5, -181.5], [53.5, -185], [56, -189.5]], h: 0.6, w: 0.6, mat: 'stone', color: '#a39a8a', cap: false }, // Belchenstr. P06R+P07L+Luftbild
  { street: 'Salzbrunnenstraße', t: 'hedge', pts: [[51, -182.2], [53, -185.6], [55.4, -190], [57, -192.8]], h: 1.6, w: 1, kind: 'privet', color: '#3f6a2e' }, // Belchenstr. P06R+P07L+P08L+Luftbild
  { street: 'Salzbrunnenstraße', t: 'hedge', pts: [[56.9, -176.2], [59.7, -180.9], [63, -186.7], [66.1, -192.1]], h: 3, w: 2.5, kind: 'wild', color: '#7a9a3a' }, // P07L+P08R+Luftbild
  { street: 'Salzbrunnenstraße', t: 'wall', pts: [[58.2, -193.5], [59.5, -197], [60.8, -200.5]], h: 0.4, w: 0.5, mat: 'stone', color: '#9a9488', cap: false }, // P08L (Steinkante)
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [61.3, -202.5], r: 0.9, h: 1.2, kind: 'green', color: '#a8b040' }, // P08L+Luftbild
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [60, -199.5], r: 0.6, h: 0.8, kind: 'flowering', flower: '#d84a6a' }, // P08L
  { street: 'Salzbrunnenstraße', t: 'wall', pts: [[66.2, -193.5], [67.4, -196.5], [72, -197.2]], h: 1.6, w: 0.3, mat: 'plaster', color: '#d8d4cc' }, // P08R+Luftbild
  { street: 'Salzbrunnenstraße', t: 'planter', p: [63.4, -205.8], kind: 'pot', color: '#6a4a3a', colors: ['#7a4ab0'] }, // P09L
  { street: 'Salzbrunnenstraße', t: 'planter', p: [63.7, -207.6], kind: 'pot', color: '#4a4a4a', colors: ['#8a5ac0', '#4a7a35'] }, // P09L
  { street: 'Salzbrunnenstraße', t: 'fence', pts: [[63, -216.2], [64.5, -218.5]], h: 1.8, style: 'privacy', color: '#8a5a3a' }, // P09L
  { street: 'Salzbrunnenstraße', t: 'hedge', pts: [[67.8, -219.5], [70, -223.5]], h: 1.3, w: 0.8, kind: 'mixed' }, // P09L
  { street: 'Salzbrunnenstraße', t: 'hedge', pts: [[72.8, -204.9], [75.8, -210.3], [79.3, -216.4]], h: 2.5, w: 1.5, kind: 'privet', color: '#3f5f2a' }, // P09R+Luftbild
  { street: 'Salzbrunnenstraße', t: 'hedge', pts: [[80.6, -218.2], [83.1, -222.7], [85.9, -227.5]], h: 2, w: 2, kind: 'wild' }, // P10R+Luftbild
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [76, -229.5], r: 1, h: 0.9, kind: 'green', color: '#9a2a2a' }, // P10L+Luftbild
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [77.4, -232.6], r: 0.8, h: 1.3, kind: 'green', color: '#2f4f2a' }, // P10L+Luftbild
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [74.4, -234.5], r: 0.8, h: 1, kind: 'green', color: '#4a6e35' }, // P10L+Luftbild
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [84.5, -243.7], r: 1.4, h: 2, kind: 'green', color: '#4a6a35' }, // P11L+Luftbild
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [89, -251.5], r: 1, h: 1.6, kind: 'green', color: '#b08a3a' }, // P11L+Luftbild
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [89.5, -254.5], r: 0.9, h: 1.3, kind: 'green', color: '#3a5a2a' }, // P11L+Luftbild
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [95, -266.5], r: 2, h: 3.8, kind: 'green', color: '#4a2a3a' }, // P12L+P11L+Luftbild
  { street: 'Salzbrunnenstraße', t: 'shrub', p: [93.2, -263.5], r: 1.5, h: 2, kind: 'green', color: '#3f6a2e' }, // P12L
  { street: 'Salzbrunnenstraße', t: 'hedge', pts: [[92.5, -239.2], [95.7, -244.8], [98.7, -250.2], [101.7, -255.4], [104.2, -259.8]], h: 2.8, w: 2, kind: 'mixed', color: '#6a8a35' }, // P11R+P12R+P10R+Luftbild
  // ===== Schafgässle =====
  { street: 'Schafgässle', t: 'wall', pts: [[-187.7, 42.1], [-182, 44.6]], h: 0.3, w: 0.3, mat: 'concrete', color: '#bdb8ae' }, // P00L (Hochbeet vor dem Haus, Lage nach Luftbild geschätzt)
  { street: 'Schafgässle', t: 'shrub', p: [-186.8, 40.7], r: 0.9, h: 1.6, kind: 'green' }, // P00L
  { street: 'Schafgässle', t: 'shrub', p: [-185.5, 42], r: 0.6, h: 0.9, kind: 'hydrangea', flower: '#e6e6d6' }, // P00L
  { street: 'Schafgässle', t: 'shrub', p: [-181, 43.6], r: 0.8, h: 2, kind: 'boxwood' }, // P00L
  { street: 'Schafgässle', t: 'wall', pts: [[-178.3, 46.3], [-171.2, 49.2]], h: 1, w: 0.3, mat: 'plaster', color: '#eeeeea' }, // P00L+Luftbild
  { street: 'Schafgässle', t: 'hedge', pts: [[-178, 45.5], [-171, 48.4]], h: 1.5, w: 0.7, kind: 'privet' }, // P00L+Luftbild
  { street: 'Schafgässle', t: 'wall', pts: [[-163.5, 56.2], [-158.8, 56.9], [-152.5, 57.1]], h: 1.4, w: 0.3, mat: 'plaster', color: '#d8b8a8' }, // P01R+P02R+Luftbild
  { street: 'Schafgässle', t: 'hedge', pts: [[-163.3, 57], [-158.8, 57.7], [-152.7, 57.9]], h: 1.9, w: 0.8, kind: 'privet', color: '#7a9a3a' }, // P01R+P02R
  { street: 'Schafgässle', t: 'hedge', pts: [[-106, 51.6], [-100, 51.3], [-94.5, 51]], h: 0.9, w: 0.7, kind: 'mixed', color: '#3c4a28' }, // P04L+Luftbild
  { street: 'Schafgässle', t: 'wall', pts: [[-91.8, 51.3], [-84, 51], [-75.6, 50.8]], h: 0.4, w: 0.3, mat: 'concrete', color: '#c8b878' }, // P05L+Luftbild
  { street: 'Schafgässle', t: 'hedge', pts: [[-91.6, 50.6], [-84, 50.3], [-75.8, 50]], h: 1.1, w: 0.6, kind: 'privet' }, // P05L+Luftbild
  { street: 'Schafgässle', t: 'shrub', p: [-92.5, 49], r: 0.7, h: 2.2, kind: 'rose', flower: '#c81830' }, // P05L (Rosenbogen am Tor)
  { street: 'Schafgässle', t: 'shrub', p: [-89, 49.2], r: 0.5, h: 1.2, kind: 'rose', flower: '#d02030' }, // P05L
  { street: 'Schafgässle', t: 'shrub', p: [-85.5, 48.5], r: 1, h: 2.2, kind: 'grass' }, // P05L (Pampasgras)
  // ===== Schloßstraße =====
  // Schlossmauer, Tor und Schlossgarten baut schloss.js
  { street: 'Schloßstraße', t: 'fence', pts: [[-1301.5, 669.9], [-1313.7, 655.4]], h: 1.8, style: 'privacy', color: '#4b4f55' }, // P0L+Luftbild
  { street: 'Schloßstraße', t: 'wall', pts: [[-1313.1, 644.3], [-1320.4, 636]], h: 1.2, w: 0.3, mat: 'plaster', color: '#e9e6de', capColor: '#dcd8ce' }, // P1R+Luftbild
  { street: 'Schloßstraße', t: 'flowers', p: [-1311.4, 638.8], r: 0.8, h: 0.3, colors: ['#f2d33c', '#e8b830'] }, // P1R
  { street: 'Schloßstraße', t: 'shrub', p: [-1325.5, 619.5], r: 1.8, h: 2.5, kind: 'green', color: '#4a7330' }, // P2R+P12L+Luftbild
  { street: 'Schloßstraße', t: 'wall', pts: [[-1349.9, 612.6], [-1342.2, 623.3], [-1341.3, 625.6], [-1341, 626.3]], h: 1.3, w: 0.4, mat: 'limestone', color: '#bcb4a0', cap: false }, // P11R+Luftbild
  { street: 'Schloßstraße', t: 'hedge', pts: [[-1350.7, 613.7], [-1343.3, 623.9], [-1342.7, 625.6]], h: 3.5, w: 2, kind: 'wild', color: '#3d5f2a' }, // P11R+Luftbild
  { street: 'Schloßstraße', t: 'fence', pts: [[-1341, 626.3], [-1341.9, 626.4], [-1345.9, 627], [-1355.5, 630.6], [-1356.4, 631.1]], h: 1, style: 'picket', color: '#a8875e' }, // P3R+P2L+Luftbild
  { street: 'Schloßstraße', t: 'shrub', p: [-1351.7, 628.1], r: 0.5, h: 1, kind: 'boxwood' }, // P3R
  { street: 'Schloßstraße', t: 'shrub', p: [-1350.8, 627.6], r: 0.7, h: 1.8, kind: 'flowering', flower: '#f3e6ee' }, // P3R
  { street: 'Schloßstraße', t: 'shrub', p: [-1349.9, 627.5], r: 0.4, h: 1.5, kind: 'conifer' }, // P3R
  { street: 'Schloßstraße', t: 'shrub', p: [-1348.5, 626.1], r: 1.3, h: 2.6, kind: 'green' }, // P3R
  { street: 'Schloßstraße', t: 'shrub', p: [-1344.6, 625], r: 1.2, h: 2.2, kind: 'green' }, // P3R
  { street: 'Schloßstraße', t: 'wall', pts: [[-1345.3, 634.6], [-1349.3, 636.1]], h: 1.8, w: 0.3, mat: 'concrete', color: '#a9a59c', cap: false }, // P3L
  { street: 'Schloßstraße', t: 'wall', pts: [[-1365.1, 636.2], [-1368.2, 637.7]], h: 1.1, w: 0.3, mat: 'plaster', color: '#e3d9c6', capColor: '#d6ccb8' }, // P4R+P5R
  { street: 'Schloßstraße', t: 'wall', pts: [[-1369.5, 638.4], [-1371.4, 639.4], [-1388.2, 648.1]], h: 1, w: 0.3, mat: 'plaster', color: '#e3d9c6', capColor: '#d6ccb8' }, // P4R+P5R
  { street: 'Schloßstraße', t: 'flowers', pts: [[-1364, 642.7], [-1368.6, 644.9], [-1372.7, 647.1]], h: 0.5, w: 0.5, colors: ['#6f9a3c', '#b7c94e', '#e3df6e'] }, // P4L
  { street: 'Schloßstraße', t: 'fence', pts: [[-1373.2, 647.7], [-1376.9, 649.7]], h: 1.7, style: 'privacy', color: '#b8946a' }, // P4L
  { street: 'Schloßstraße', t: 'planter', p: [-1384.4, 654.3], r: 0.9, kind: 'trough', color: '#b9ab92', colors: ['#8f9a86', '#8e7cc3'] }, // P5L
  { street: 'Schloßstraße', t: 'shrub', p: [-1386.3, 657.7], r: 1.2, h: 0.8, kind: 'green' }, // P5L+Luftbild
  { street: 'Schloßstraße', t: 'wall', pts: [[-1400.5, 662.9], [-1405, 665.1]], h: 0.5, w: 0.4, mat: 'stone', color: '#9e958a', cap: false }, // P6L
  { street: 'Schloßstraße', t: 'shrub', p: [-1402.6, 664.9], r: 0.8, h: 1.2, kind: 'green' }, // P6L
  { street: 'Schloßstraße', t: 'shrub', p: [-1404.1, 665.5], r: 0.4, h: 0.6, kind: 'green', color: '#7a3a3a' }, // P6L
  { street: 'Schloßstraße', t: 'shrub', p: [-1414.8, 671.3], r: 1.5, h: 3, kind: 'green' }, // P7L+Luftbild
  { street: 'Schloßstraße', t: 'shrub', p: [-1412.6, 670.1], r: 1.2, h: 1.6, kind: 'flowering', color: '#9fbf45', flower: '#c9d94a' }, // P7L
  { street: 'Schloßstraße', t: 'hedge', pts: [[-1406.3, 698], [-1413.2, 680.7], [-1416.8, 673.8]], h: 3, w: 1.8, kind: 'mixed', color: '#3f6a2e' }, // P8R+P9R+Luftbild
  { street: 'Schloßstraße', t: 'wall', pts: [[-1330.9, 620.4], [-1330.1, 617.6], [-1328.6, 612.2]], h: 0.4, w: 0.3, mat: 'concrete', color: '#b5b0a5', cap: false, fence: 'wire', fenceH: 1.2 }, // P13R
  { street: 'Schloßstraße', t: 'shrub', p: [-1328.2, 617.5], r: 1.5, h: 3.5, kind: 'flowering', flower: '#9b6fb5' }, // P13R
  { street: 'Schloßstraße', t: 'shrub', p: [-1329.5, 618.7], r: 0.7, h: 0.7, kind: 'flowering', flower: '#e0a030' }, // P13R
  { street: 'Schloßstraße', t: 'shrub', p: [-1328.9, 620.1], r: 1.5, h: 3, kind: 'green' }, // P13R
  // ===== Schulstraße =====
  { street: 'Schulstraße', t: 'shrub', p: [-1146.4, 703.3], r: 1.3, h: 3.5, kind: 'flowering', flower: '#8b4f9e' }, // P0L
  { street: 'Schulstraße', t: 'shrub', p: [-1149.2, 704.4], r: 0.8, h: 1.5, kind: 'green' }, // P0L
  { street: 'Schulstraße', t: 'hedge', pts: [[-1153.8, 706.4], [-1174.7, 713.4], [-1173.9, 712.8]], h: 1.5, w: 1, kind: 'hornbeam', color: '#7fa83e' }, // P0L+P1L+Luftbild
  { street: 'Schulstraße', t: 'fence', pts: [[-1154, 705.8], [-1175, 712.8], [-1174.4, 712.3]], h: 1, style: 'wire', color: '#8a7a62' }, // P1L
  { street: 'Schulstraße', t: 'shrub', p: [-1181.7, 720.5], r: 1, h: 1.3, kind: 'green' }, // P2L
  { street: 'Schulstraße', t: 'fence', pts: [[-1198.5, 725], [-1204, 733]], h: 1.2, style: 'metal', color: '#8c8f92' }, // P3R
  { street: 'Schulstraße', t: 'hedge', pts: [[-1194.1, 740.8], [-1200.4, 755.5]], h: 1.3, w: 2, kind: 'mixed', color: '#4f7a34' }, // P4L+Luftbild
  { street: 'Schulstraße', t: 'wall', pts: [[-1197.5, 754.5], [-1193.5, 753]], h: 1, w: 0.8, mat: 'granite', color: '#8f877c', cap: false }, // P4L+P3L
  { street: 'Schulstraße', t: 'hedge', pts: [[-1197.3, 755.3], [-1193.3, 753.8]], h: 1.2, w: 1, kind: 'mixed', color: '#5a8a3a' }, // P4L+P3L
  { street: 'Schulstraße', t: 'wall', pts: [[-1205.1, 743.7], [-1208.6, 751.9], [-1209, 752.4]], h: 0.4, w: 0.3, mat: 'concrete', color: '#c4bfb4', cap: false, fence: 'panel', fenceH: 1 }, // P4R
  { street: 'Schulstraße', t: 'fence', pts: [[-1208.3, 753], [-1214, 760]], h: 1.2, style: 'picket', color: '#e0a83a' }, // P4R+P5R
  { street: 'Schulstraße', t: 'fence', pts: [[-1213.6, 760.3], [-1213.2, 759.8], [-1221.2, 764.1], [-1226.1, 764.9], [-1242.5, 764.9]], h: 1.2, style: 'panel', color: '#a6aaad' }, // P5R+P6R
  { street: 'Schulstraße', t: 'fence', pts: [[-1252.5, 764.9], [-1261.5, 764.9]], h: 1, style: 'panel', color: '#b4b7b9' }, // P7R
  { street: 'Schulstraße', t: 'shrub', p: [-1254.5, 764.3], r: 0.4, h: 0.7, kind: 'boxwood', color: '#9bb23a' }, // P7R
  { street: 'Schulstraße', t: 'shrub', p: [-1251.5, 764.9], r: 0.4, h: 0.6, kind: 'boxwood', color: '#9bb23a' }, // P7R
  { street: 'Schulstraße', t: 'wall', pts: [[-1269.5, 765.4], [-1272.7, 765.4], [-1285.5, 762.7]], h: 0.3, w: 0.3, mat: 'concrete', color: '#b9b5ad', cap: false, fence: 'metal', fenceH: 0.9 }, // P8R
  { street: 'Schulstraße', t: 'fence', pts: [[-1286.3, 761.6], [-1290.2, 760.7], [-1300.1, 759.7]], h: 1.2, style: 'panel', color: '#b4b7b9' }, // P8R+P9R
  { street: 'Schulstraße', t: 'shrub', p: [-1298, 758.3], r: 1.5, h: 3.5, kind: 'green' }, // P9R
  { street: 'Schulstraße', t: 'shrub', p: [-1299.5, 758.8], r: 1.2, h: 3, kind: 'flowering', flower: '#a07cc0' }, // P9R+P8R
  { street: 'Schulstraße', t: 'wall', pts: [[-1334.7, 757.2], [-1338.7, 756.9]], h: 0.5, w: 0.3, mat: 'concrete', color: '#b1aea6', cap: false }, // P11R
  { street: 'Schulstraße', t: 'hedge', pts: [[-1405.2, 758.6], [-1412, 759.9]], h: 3, w: 2, kind: 'wild', color: '#4e6f30' }, // P15R
  { street: 'Schulstraße', t: 'wall', pts: [[-1276, 778], [-1276.4, 773.2], [-1277.5, 772.3]], h: 0.7, w: 0.4, mat: 'stone', color: '#8a7f70', cap: false }, // P8L
  { street: 'Schulstraße', t: 'flowers', pts: [[-1276.9, 777.8], [-1277.2, 774], [-1278.2, 773.2]], h: 0.5, w: 1, colors: ['#5d8a3a', '#9b8fc4', '#ece6f0', '#d9466b'] }, // P8L
  { street: 'Schulstraße', t: 'shrub', p: [-1277.6, 776.5], r: 1.2, h: 3.5, kind: 'green' }, // P8L
  { street: 'Schulstraße', t: 'wall', pts: [[-1310.3, 766.2], [-1319.2, 765.3]], h: 0.8, w: 0.4, mat: 'stone', color: '#5f5650', cap: false, fence: 'wire', fenceH: 1.2 }, // P10L
  { street: 'Schulstraße', t: 'wall', pts: [[-1320.4, 765.1], [-1323.3, 764.8]], h: 0.8, w: 0.4, mat: 'stone', color: '#5f5650', cap: false, fence: 'wire', fenceH: 1.2 }, // P10L
  { street: 'Schulstraße', t: 'wall', pts: [[-1354, 762.3], [-1368, 761.4]], h: 0.7, w: 0.4, mat: 'stone', color: '#6d655b', cap: false }, // P12L+P13L
  { street: 'Schulstraße', t: 'wall', pts: [[-1354.1, 764.2], [-1367.1, 763.4]], h: 0.8, w: 0.4, mat: 'stone', color: '#6d655b', cap: false }, // P12L+P13L
  { street: 'Schulstraße', t: 'shrub', p: [-1356.1, 763.1], r: 0.5, h: 0.6, kind: 'grass' }, // P12L
  { street: 'Schulstraße', t: 'shrub', p: [-1360.1, 762.7], r: 0.4, h: 0.5, kind: 'green', color: '#a3b84a' }, // P12L
  { street: 'Schulstraße', t: 'shrub', p: [-1363.6, 762.6], r: 0.5, h: 0.6, kind: 'grass' }, // P12L
  { street: 'Schulstraße', t: 'flowers', pts: [[-1358.2, 764.4], [-1363.2, 764.1]], h: 0.2, w: 0.6, colors: ['#e07bb5', '#c060a0', '#f0f0f0'] }, // P12L
  { street: 'Schulstraße', t: 'flowers', p: [-1357.6, 763.1], r: 0.4, h: 0.4, colors: ['#c8303a'] }, // P12L
  { street: 'Schulstraße', t: 'shrub', p: [-1365.4, 768], r: 1.2, h: 3, kind: 'green', color: '#b5332e' }, // P12L
  // ===== St.Alban =====
  { street: 'St.Alban', t: 'wall', pts: [[-182.8, 19], [-182.8, 15], [-184, 13.4], [-189, 12.6]], h: 0.8, w: 0.4, mat: 'stone', color: '#a49c8c', fence: 'metal', fenceH: 0.8 }, // P00L+Luftbild (Eckgrundstück an der Gabelung)
  { street: 'St.Alban', t: 'shrub', p: [-186, 15.5], r: 2, h: 3.5, kind: 'green' }, // P00L+Luftbild
  { street: 'St.Alban', t: 'shrub', p: [-183.5, 17], r: 1.5, h: 3, kind: 'green' }, // P00L
  { street: 'St.Alban', t: 'wall', pts: [[-184, 5.6], [-193.5, 4.3], [-203.3, 2.6]], h: 0.2, w: 0.3, mat: 'concrete', color: '#b8b4aa' }, // P00R+P01R
  { street: 'St.Alban', t: 'fence', pts: [[-184, 5.5], [-193.5, 4.2], [-203.3, 2.5]], h: 1, style: 'wood', color: '#b0603a' }, // P00R+P01R (orangebraune Bretter mit runden Köpfen)
  { street: 'St.Alban', t: 'shrub', p: [-186.5, 3.8], r: 0.9, h: 1.6, kind: 'green' }, // P00R
  { street: 'St.Alban', t: 'shrub', p: [-190.5, 3.2], r: 1, h: 2, kind: 'green' }, // P00R
  { street: 'St.Alban', t: 'shrub', p: [-202, 2], r: 1.2, h: 2.5, kind: 'green', color: '#b8b040' }, // P01R (gelb verfärbter Strauch an der Scheune)
  { street: 'St.Alban', t: 'shrub', p: [-203.5, 9.6], r: 1.5, h: 3, kind: 'green' }, // P01L+Luftbild
  { street: 'St.Alban', t: 'shrub', p: [-221.9, -3], r: 0.5, h: 0.9, kind: 'green' }, // P02R
  { street: 'St.Alban', t: 'hedge', pts: [[-236, 2], [-233, 3.2]], h: 1.5, w: 1.2, kind: 'mixed' }, // P02L+Luftbild
  { street: 'St.Alban', t: 'wall', pts: [[-240.5, -1], [-235.5, 1]], h: 0.6, w: 0.5, mat: 'stone', color: '#8e887c' }, // P03L+Luftbild
  { street: 'St.Alban', t: 'shrub', p: [-239.5, 0.3], r: 0.6, h: 0.9, kind: 'grass' }, // P03L
  { street: 'St.Alban', t: 'shrub', p: [-237.8, 1], r: 0.7, h: 0.7, kind: 'green' }, // P03L
  { street: 'St.Alban', t: 'planter', p: [-236.6, 1.9], r: 0.6, kind: 'barrel', color: '#3a2a20', colors: ['#c8a040'] }, // P03L (Weinfass)
  { street: 'St.Alban', t: 'wall', pts: [[-246, -9.8], [-240, -7.5], [-234, -5.2]], h: 0.7, w: 0.5, mat: 'stone', color: '#9a9488' }, // P03R+Luftbild (Trockenmauer)
  { street: 'St.Alban', t: 'flowers', pts: [[-245.5, -10.6], [-240, -8.4], [-235, -6.4]], h: 0.5, w: 1.4, colors: ['#8a70c0', '#c8b0e0', '#e0e0d0'] }, // P03R (Steingarten)
  { street: 'St.Alban', t: 'shrub', p: [-238.5, -8.3], r: 0.5, h: 0.9, kind: 'grass' }, // P03R
  { street: 'St.Alban', t: 'shrub', p: [-243, -10], r: 0.5, h: 0.8, kind: 'grass' }, // P03R
  { street: 'St.Alban', t: 'shrub', p: [-259, -18], r: 0.8, h: 1.4, kind: 'rose', flower: '#c82838' }, // P04R
  { street: 'St.Alban', t: 'shrub', p: [-257.2, -17], r: 0.8, h: 1.3, kind: 'rose', flower: '#f4f0e8' }, // P04R
  { street: 'St.Alban', t: 'shrub', p: [-255.5, -17.9], r: 0.8, h: 1.8, kind: 'flowering', flower: '#f0b020' }, // P04R (Stauden-Sonnenblume)
  { street: 'St.Alban', t: 'shrub', p: [-257.5, -19.5], r: 1.5, h: 3, kind: 'green' }, // P04R+Luftbild
  { street: 'St.Alban', t: 'shrub', p: [-266, -23], r: 1.2, h: 2, kind: 'green' }, // P04R+Luftbild
  { street: 'St.Alban', t: 'hedge', pts: [[-271.8, -29.4], [-274.6, -32.6], [-278, -36.4], [-281, -39.6]], h: 1.6, w: 2, kind: 'mixed', color: '#a0a040' }, // P05R+Luftbild (Strauchrabatte, Herbstfärbung)
  { street: 'St.Alban', t: 'shrub', p: [-276.5, -34], r: 1, h: 1.8, kind: 'green', color: '#b07890' }, // P05R
  { street: 'St.Alban', t: 'shrub', p: [-279.5, -37], r: 0.5, h: 1, kind: 'grass' }, // P05R (Yucca)
  { street: 'St.Alban', t: 'shrub', p: [-282, -42.5], r: 1.3, h: 2.2, kind: 'green' }, // P05R
  // ===== Storchengasse =====
  { street: 'Storchengasse', t: 'hedge', pts: [[-59.6, -42.6], [-58, -49], [-57, -54]], h: 1.3, w: 0.9, kind: 'laurel', color: '#3e6a2a' }, // P00L+P00R+Luftbild
  { street: 'Storchengasse', t: 'shrub', p: [-66.6, -45.8], r: 0.4, h: 0.8, kind: 'conifer' }, // P00L (Ostseite Storchen)
  { street: 'Storchengasse', t: 'shrub', p: [-66.4, -47.5], r: 0.5, h: 0.5, kind: 'green' }, // P00L
  { street: 'Storchengasse', t: 'planter', p: [-62.7, -61.5], kind: 'trough', color: '#7a6a5a', colors: ['#d82030'], rot: 1.4 }, // P01L (Geranien an der Garage)
  { street: 'Storchengasse', t: 'shrub', p: [-62.8, -63.5], r: 0.6, h: 0.5, kind: 'green' }, // P01L
  { street: 'Storchengasse', t: 'wall', pts: [[-53.6, -76], [-53, -80], [-51.6, -88]], h: 0.4, w: 0.3, mat: 'brick', color: '#a0605a', fence: 'picket', fenceH: 0.8 }, // P01R+P02R+Luftbild (weißer Staketenzaun)
  { street: 'Storchengasse', t: 'flowers', pts: [[-52.2, -80], [-51.6, -86.5]], h: 0.8, w: 1.5, colors: ['#f4f4f0', '#e8e0f0'] }, // P01R
  { street: 'Storchengasse', t: 'shrub', p: [-52, -77.8], r: 1, h: 0.5, kind: 'green' }, // P01R (Kürbis/Zucchini)
  { street: 'Storchengasse', t: 'shrub', p: [-52.5, -84], r: 0.8, h: 1.4, kind: 'flowering', flower: '#f4f4f0' }, // P01R
  { street: 'Storchengasse', t: 'shrub', p: [-52.8, -77], r: 0.7, h: 1.5, kind: 'rose', flower: '#e05030' }, // P02R
  { street: 'Storchengasse', t: 'planter', p: [-45.6, -106], r: 0.3, kind: 'pot', color: '#b5562e', colors: ['#5a8a3a'] }, // P03R
  { street: 'Storchengasse', t: 'planter', p: [-50, -121], kind: 'trough', color: '#6a5a4a', colors: ['#d82030', '#f080a0'], rot: 0.6 }, // P04L (Geranien vor der Scheune)
  { street: 'Storchengasse', t: 'planter', p: [-48.5, -122.5], r: 0.3, kind: 'pot', color: '#b5562e', colors: ['#e04050'] }, // P04L
  { street: 'Storchengasse', t: 'fence', pts: [[-34.7, -138.2], [-27, -158.2]], h: 1, style: 'panel', color: '#2e2e2e' }, // P05L+Luftbild
  { street: 'Storchengasse', t: 'shrub', p: [-29, -153], r: 0.8, h: 1.3, kind: 'rose', flower: '#e0507a' }, // P05L
  { street: 'Storchengasse', t: 'shrub', p: [-28.2, -155.5], r: 0.7, h: 1.2, kind: 'rose', flower: '#d03040' }, // P05L
  { street: 'Storchengasse', t: 'wall', pts: [[-31.5, -129.5], [-30.3, -131.8], [-25.7, -143.9]], h: 0.5, w: 0.3, mat: 'concrete', color: '#c8c6c0', fence: 'panel', fenceH: 1 }, // P05R+Luftbild
  { street: 'Storchengasse', t: 'wall', pts: [[-26.9, -158.6], [-23.9, -166.2]], h: 0.4, w: 0.3, mat: 'concrete', color: '#a8a59c', fence: 'wire', fenceH: 1 }, // P06L
  { street: 'Storchengasse', t: 'hedge', pts: [[-28.5, -159.5], [-26, -166.5]], h: 2.5, w: 1.5, kind: 'wild' }, // P06L+Luftbild
  { street: 'Storchengasse', t: 'wall', pts: [[-22, -152.5], [-21.2, -155.2], [-20, -158.5]], h: 0.4, w: 0.3, mat: 'concrete', color: '#b8b4aa' }, // P06R
  { street: 'Storchengasse', t: 'fence', pts: [[-21.2, -155.2], [-20, -158.5]], h: 1.8, style: 'privacy', color: '#8a7a68' }, // P06R
  { street: 'Storchengasse', t: 'shrub', p: [-21.6, -153.4], r: 1.3, h: 2.5, kind: 'green' }, // P06R (Kirschlorbeer)
  // ===== Vogesenstraße =====
  { street: 'Vogesenstraße', t: 'fence', pts: [[16, -337.6], [17.4, -336.4], [21.6, -332.7]], h: 0.8, style: 'wire', color: '#3c6a40' }, // P04L
  { street: 'Vogesenstraße', t: 'hedge', pts: [[16.5, -337.7], [18, -336.4]], h: 0.9, w: 0.8, kind: 'privet', color: '#6a8a3a' }, // P04L
  { street: 'Vogesenstraße', t: 'shrub', p: [20.2, -338], r: 0.7, h: 3.8, kind: 'conifer', color: '#2f5a2a' }, // P04L
  { street: 'Vogesenstraße', t: 'shrub', p: [21, -337.3], r: 0.7, h: 3.6, kind: 'conifer', color: '#2f5a2a' }, // P04L
  { street: 'Vogesenstraße', t: 'shrub', p: [21.5, -336.2], r: 0.6, h: 1.2, kind: 'green' }, // P04L
  { street: 'Vogesenstraße', t: 'shrub', p: [15.4, -328.2], r: 1.8, h: 2.5, kind: 'green', color: '#4a6a35' }, // P04R+Luftbild
  { street: 'Vogesenstraße', t: 'shrub', p: [14.4, -327.1], r: 0.6, h: 1.2, kind: 'green' }, // P04R
  { street: 'Vogesenstraße', t: 'fence', pts: [[35.8, -321.5], [42.3, -316]], h: 1.2, style: 'privacy', color: '#8a5a3a' }, // P04L+Luftbild
  { street: 'Vogesenstraße', t: 'hedge', pts: [[35.4, -321], [41.8, -315.4]], h: 0.9, w: 0.8, kind: 'mixed' }, // P04L+Luftbild
  { street: 'Vogesenstraße', t: 'hedge', pts: [[32.4, -314.4], [39.4, -308.4]], h: 1.5, w: 1.2, kind: 'mixed' }, // Luftbild
  { street: 'Vogesenstraße', t: 'hedge', pts: [[62.5, -290.6], [66.5, -287.6]], h: 2.8, w: 2, kind: 'mixed', color: '#3a5a2a' }, // P07R+Luftbild
  { street: 'Vogesenstraße', t: 'hedge', pts: [[66.6, -285.8], [71.9, -282], [78.8, -277.6]], h: 1.6, w: 2, kind: 'wild' }, // P07R+Luftbild
  { street: 'Vogesenstraße', t: 'shrub', p: [71.3, -293.9], r: 1.3, h: 2, kind: 'green' }, // P07L
  { street: 'Vogesenstraße', t: 'hedge', pts: [[80.3, -285.6], [86.9, -281.6], [93.9, -277.4]], h: 2.3, w: 1.5, kind: 'privet', color: '#4a7032' }, // P08L+P09L+Luftbild
  { street: 'Vogesenstraße', t: 'hedge', pts: [[101.5, -279.5], [105.5, -277.6], [109.5, -275.5]], h: 2, w: 1.2, kind: 'privet', color: '#4a7032' }, // P09L+Luftbild
  { street: 'Vogesenstraße', t: 'hedge', pts: [[81, -276.2], [85.4, -273.6], [89.3, -271.2]], h: 1.8, w: 2, kind: 'mixed', color: '#5a7a40' }, // P08R+Luftbild
  { street: 'Vogesenstraße', t: 'shrub', p: [92.2, -268.5], r: 1.5, h: 3.5, kind: 'green', color: '#6a2a3a' }, // P08R+P09R+Luftbild
  { street: 'Vogesenstraße', t: 'shrub', p: [94.8, -267.8], r: 1.4, h: 2.4, kind: 'green' }, // P09R+Luftbild
  { street: 'Vogesenstraße', t: 'shrub', p: [108.4, -270.6], r: 0.6, h: 0.6, kind: 'green' }, // P09L+Luftbild
  { street: 'Vogesenstraße', t: 'shrub', p: [110.5, -269.2], r: 0.4, h: 0.8, kind: 'grass', color: '#b8b060' }, // P09L+Luftbild
  { street: 'Vogesenstraße', t: 'shrub', p: [112.9, -266.7], r: 0.5, h: 0.9, kind: 'grass', color: '#a8b050' }, // P00L
  { street: 'Vogesenstraße', t: 'shrub', p: [113.8, -266.8], r: 0.5, h: 1.2, kind: 'green', color: '#c8c040' }, // P00L
  { street: 'Vogesenstraße', t: 'shrub', p: [114.5, -266.4], r: 0.5, h: 1.1, kind: 'green', color: '#c8c040' }, // P00L
  { street: 'Vogesenstraße', t: 'shrub', p: [114.1, -265.8], r: 0.8, h: 1.3, kind: 'green' }, // P00L
  { street: 'Vogesenstraße', t: 'shrub', p: [117.4, -265.3], r: 0.8, h: 1, kind: 'green' }, // P00L+Luftbild
  { street: 'Vogesenstraße', t: 'hedge', pts: [[101.9, -263.2], [107, -260.6], [112.6, -257.8], [121.6, -253.3], [131.4, -248.4]], h: 2.2, w: 2, kind: 'privet', color: '#557a35' }, // P09R+P00R+P01R+Luftbild
  { street: 'Vogesenstraße', t: 'wall', pts: [[106.6, -262.1], [113.2, -258.8], [120.1, -255.3]], h: 0.6, w: 0.4, mat: 'sandstone', color: '#9a6a50', cap: false }, // P00R
  { street: 'Vogesenstraße', t: 'shrub', p: [128.3, -249.6], r: 1.2, h: 2, kind: 'green', color: '#c8c040' }, // P01R
  { street: 'Vogesenstraße', t: 'hedge', pts: [[135.8, -246.1], [142.7, -242.5], [149.5, -238.7], [156.3, -234.9], [162.7, -231.4], [169.9, -227.7]], h: 1.3, w: 1.1, kind: 'copper', color: '#6e2a30' }, // P01R+P02R+P03R+Luftbild
  { street: 'Vogesenstraße', t: 'shrub', p: [150.9, -235.2], r: 1.5, h: 2.2, kind: 'green', color: '#a8a840' }, // P02R
  { street: 'Vogesenstraße', t: 'shrub', p: [150.5, -249.7], r: 1.5, h: 2.2, kind: 'green' }, // P02L
  { street: 'Vogesenstraße', t: 'shrub', p: [151.4, -249.3], r: 1.2, h: 2.2, kind: 'green', color: '#8a3a3a' }, // P02L
  { street: 'Vogesenstraße', t: 'shrub', p: [152.3, -248.8], r: 1.3, h: 2, kind: 'green' }, // P02L
  { street: 'Vogesenstraße', t: 'shrub', p: [153.9, -247.8], r: 1.4, h: 2.6, kind: 'conifer', color: '#2f4a28' }, // P02L
  { street: 'Vogesenstraße', t: 'shrub', p: [155.3, -245.9], r: 1, h: 1.4, kind: 'green' }, // P02L
  { street: 'Vogesenstraße', t: 'hedge', pts: [[158.8, -243.7], [164.9, -240.3], [170.5, -238.3]], h: 1.1, w: 3, kind: 'boxwood', color: '#7a9a3a' }, // P03L+Luftbild
  // ===== Weingartenstraße =====
  { street: 'Weingartenstraße', t: 'hedge', pts: [[-1546.4, 858.4], [-1556.9, 875.7], [-1560.3, 881.9]], h: 1, w: 0.7, kind: 'mixed', color: '#4a6e32' }, // Luftbild
  { street: 'Weingartenstraße', t: 'fence', pts: [[-1433.5, 801.5], [-1437.5, 800.6]], h: 0.8, style: 'wood', color: '#8a6a48' }, // P15L
  { street: 'Weingartenstraße', t: 'flowers', pts: [[-1433.7, 802.3], [-1437.3, 801.5]], h: 0.4, w: 0.8, colors: ['#e8d040', '#4f7a34'] }, // P15L
  // ===== Werbenweg =====
  // ===== von-Andlaw-Straße =====
  { street: 'von-Andlaw-Straße', t: 'hedge', pts: [[251.3, -1202.1], [249.2, -1195.1], [247.6, -1190.1]], h: 1.2, w: 1, kind: 'mixed' }, // Luftbild
  { street: 'von-Andlaw-Straße', t: 'hedge', pts: [[259.8, -1199.4], [257.7, -1192.5], [256.4, -1188.4]], h: 1.8, w: 1.4, kind: 'mixed' }, // Luftbild
  { street: 'von-Andlaw-Straße', t: 'shrub', p: [229.4, -1152.4], r: 1.3, h: 2, kind: 'green' }, // Luftbild
  { street: 'von-Andlaw-Straße', t: 'shrub', p: [234.1, -1142.9], r: 1.2, h: 1.8, kind: 'green' }, // Luftbild
  { street: 'von-Andlaw-Straße', t: 'hedge', pts: [[209.5, -1131.5], [205.5, -1126.5]], h: 1.8, w: 1, kind: 'mixed' }, // Luftbild
  { street: 'von-Andlaw-Straße', t: 'shrub', p: [217, -1115], r: 1.2, h: 1.2, kind: 'green' }, // Luftbild (Beet an der Hausecke)
  { street: 'von-Andlaw-Straße', t: 'hedge', pts: [[216.5, -1113], [212, -1107], [208, -1100.5]], h: 1.5, w: 1, kind: 'mixed' }, // Luftbild
];
