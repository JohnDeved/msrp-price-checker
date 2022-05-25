import msrp from '../data/msrp.json'

export default msrp
export const msrpCards = Object.keys(msrp).filter(g => msrp[g as keyof typeof msrp])