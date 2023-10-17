// FIXME copied from ../tools/lib/links.js

function unHyphenCat (e) {
  e = e.replace(/-/g, '')
  e = e.match(/.{1,2}/g)
  // console.log(e) // ['ff', '8a', 'ab', 'ee', '5e', '6c', '52', '9c', 'ad', '98', 'cc', '08', 'e6', 'bf', 'd3', '5c']
  e = [e[3], e[2], e[1], e[0], e[5], e[4], e[7], e[6], e[8], e[9], e[10], e[11], e[12], e[13], e[14], e[15]]
  // console.log(e) // eeab8aff6c5e9c52ad98cc08e6bfd35c (by an array)
  return e
}

export function longToShortId (e) {
  // console.log(e)
  e = unHyphenCat(e)
  // console.log(e)
  e = e.map(function (e) { return String.fromCharCode(parseInt(e, 16)) }).join('')
  // console.log(e) // î«ÿl^R­Ìæ¿Ó\
  e = btoa(e)
  // console.log(e)
  e = e.replace(/==$/, '')
  // console.log(e)
  e = e.replace(/\+/g,"-").replace(/\//g,"_")
  return e
}

// TODO cleanup
const padTwo = (str) => (1 === ('' + str).length) ? '0' + str : str
const hyphenCat = (e) => {
  return e[3]+e[2]+e[1]+e[0]+"-"+e[5]+e[4]+"-"+e[7]+e[6]+"-"+e[8]+e[9]+"-"+e[10]+e[11]+e[12]+e[13]+e[14]+e[15]
}
export function shortToLongId (e) {
  // console.log(e) // 7quK_2xenFKtmMwI5r_TXA
  e = e.replace(/-/g,"+").replace(/_/g,"/")
  e += "=="
  // console.log(e) // 7quK/2xenFKtmMwI5r/TXA==
  e = atob(e)
  // console.log(e) // î«ÿl^R­Ìæ¿Ó\
  e = e.split("")
  e = e.map(function (e) { return padTwo(e.charCodeAt(0).toString(16)) })
  // console.log(e) // ['ee', 'ab', '8a', 'ff', '6c', '5e', '9c', '52', 'ad', '98', 'cc', '08', 'e6', 'bf', 'd3', '5c']
  e = hyphenCat(e)
  // console.log(e) // ff8aabee-5e6c-529c-ad98-cc08e6bfd35c
  return e
}

// function parseBrainLink (e) {
//   var t = (e = e.replace("brain://", "")).split("/")
//   return t.length >= 3 ? {
//     brainId: shortToLongId(t[1]),
//     thoughtId: shortToLongId(t[2])
//   } : t.length >= 2 ? {
//     brainId: null,
//     thoughtId: shortToLongId(t[0])
//   } : {
//     thoughtId: null,
//     brainId: null
//   }
// }
