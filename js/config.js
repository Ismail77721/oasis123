window.OASIS_CONFIG={version:"1.7.0",worldSize:16,wellIndex:119,storageKey:"oasis_save_v1",dayMinutes:60,nightMinutes:60,maxWater:10,crops:{
watermelon:{title:"Арбуз",icon:"🍉",growSeconds:240,yield:3,seedCost:5,waterCost:1,sellPrice:4,color:0x3b9e54,ripeColor:0x63bc42,unlock:1,type:"annual"},
clover:{title:"Клевер",icon:"☘️",growSeconds:150,yield:2,seedCost:3,waterCost:1,sellPrice:2,color:0x4c9845,ripeColor:0x9cce58,unlock:1,type:"annual"},
melon:{title:"Дыня",icon:"🍈",growSeconds:360,yield:3,seedCost:9,waterCost:1,sellPrice:7,color:0x71a34a,ripeColor:0xf0c95c,unlock:3,type:"annual"},
fig:{title:"Инжир",icon:"🌿",growSeconds:600,yield:3,seedCost:14,waterCost:1,sellPrice:10,color:0x418b54,ripeColor:0x8355a1,unlock:6,type:"perennial"},
pomegranate:{title:"Гранат",icon:"🔴",growSeconds:900,yield:4,seedCost:20,waterCost:2,sellPrice:12,color:0x478747,ripeColor:0xc74439,unlock:9,type:"perennial"},
dates:{title:"Финики",icon:"🌴",growSeconds:1200,yield:5,seedCost:30,waterCost:2,sellPrice:16,color:0x3d9056,ripeColor:0xc28c37,unlock:12,type:"perennial"},
olive:{title:"Оливки",icon:"🫒",growSeconds:900,yield:4,seedCost:23,waterCost:1,sellPrice:13,color:0x457e4c,ripeColor:0x7e9a45,unlock:7,type:"perennial"},
sidr:{title:"Сидр",icon:"🌳",growSeconds:1500,yield:4,seedCost:48,waterCost:2,sellPrice:23,color:0x42804b,ripeColor:0x9aae4d,unlock:14,type:"perennial"},
cumin:{title:"Тмин",icon:"🌿",growSeconds:480,yield:4,seedCost:12,waterCost:1,sellPrice:9,color:0x739b54,ripeColor:0xb69e56,unlock:4,type:"annual"},
flowers:{title:"Цветы",icon:"🌼",growSeconds:420,yield:5,seedCost:10,waterCost:1,sellPrice:6,color:0x57a25f,ripeColor:0xeac657,unlock:3,type:"annual"},
barley:{title:"Ячмень",icon:"🌾",growSeconds:570,yield:5,seedCost:11,waterCost:1,sellPrice:8,color:0x769e55,ripeColor:0xe8b85a,unlock:5,type:"annual"},
wheat:{title:"Пшеница",icon:"🌾",growSeconds:660,yield:5,seedCost:13,waterCost:1,sellPrice:10,color:0x6d9b4f,ripeColor:0xecc066,unlock:6,type:"annual"}
}};
window.OASIS_BUILDINGS={sheep:{title:"Овечий шатёр",unlock:1,cost:70,feed:"clover",feedAmount:3,water:0,duration:480,product:"wool",amount:2,price:22},camel:{title:"Глиняный загон",unlock:2,cost:125,feed:"clover",feedAmount:5,water:3,duration:720,product:"camelMilk",amount:2,price:38},
apiary:{title:"Пасека",unlock:3,cost:160,feed:"flowers",feedAmount:5,water:1,duration:900,product:"honey",amount:3,price:46},
oilpress:{title:"Пресс для тминного масла",unlock:4,cost:220,feed:"cumin",feedAmount:4,water:0,duration:1080,product:"cuminOil",amount:2,price:95},
olivepress:{title:"Оливковый пресс",unlock:7,cost:245,feed:"olive",feedAmount:4,water:0,duration:1200,product:"oliveOil",amount:2,price:85}};

// Workshop upgrades, each with ten meaningful ranks. No tools are bought on the farm.
window.OASIS_TOOLS={
 rake:{title:'Грабли садовника',icon:'🌾',description:'Больше урожая с грядок и деревьев',base:70,scale:1.4},
 spade:{title:'Лопата земледельца',icon:'🛠️',description:'Дешевле прокладывать каналы, шире зона полива',base:85,scale:1.46},
 shears:{title:'Ножницы для шерсти',icon:'✂️',description:'Больше шерсти с одного цикла',base:95,scale:1.45},
 vessel:{title:'Сосуд для молока',icon:'🥛',description:'Больше молока за цикл производства',base:95,scale:1.45},
 bucket:{title:'Ведро для воды',icon:'🪣',description:'Больше воды из колодца и её вместимость',base:65,scale:1.42}
};
