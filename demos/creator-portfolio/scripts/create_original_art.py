"""Recreate the original fictional SVG artwork used by the three demo scenes.

This authoring script writes only the explicitly listed demo assets. Do not run
it in a customer portfolio after replacing those assets with customer work.
"""

from __future__ import annotations

import math
from html import escape
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def rect(x, y, w, h, color, radius=0):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{color}"/>'


def circle(x, y, radius, color):
    return f'<circle cx="{x}" cy="{y}" r="{radius}" fill="{color}"/>'


def ellipse(x, y, rx, ry, color):
    return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{color}"/>'


def path(d, color="none", stroke="none", width=1, extra=""):
    return f'<path d="{d}" fill="{color}" stroke="{stroke}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round" {extra}/>'


def line(x1, y1, x2, y2, color, width=3):
    return path(f'M{x1} {y1}L{x2} {y2}', stroke=color, width=width)


def text(x, y, value, size=28, color="#283d4a", weight=400):
    return f'<text x="{x}" y="{y}" fill="{color}" font-family="Arial, Microsoft YaHei, sans-serif" font-size="{size}" font-weight="{weight}">{escape(value)}</text>'


def group(content, transform):
    return f'<g transform="{transform}">{content}</g>'


def leaf(x, y, scale, angle, color):
    shape = path('M0 0C-70-65-50-150 5-180C66-148 82-57 0 0Z', color)
    shape += path('M0 0L5-145', stroke="#d6e5cd", width=3)
    return group(shape, f'translate({x} {y}) rotate({angle}) scale({scale})')


def window_cover():
    s = rect(0, 520, 1200, 280, '#eed9c2')
    s += path('M630 160L990 160L1190 800L580 800Z', '#fff3d5')
    s += rect(365, 85, 590, 438, '#f7f3ec', 10) + rect(389, 110, 542, 389, '#b6d4e5')
    s += circle(823, 195, 55, '#f4d075')
    for x, y, w, h, col in [(420, 305, 120, 194, '#7fa8b9'), (565, 355, 150, 144, '#94b7c1'), (752, 320, 145, 179, '#5e92a6')]:
        s += rect(x, y, w, h, col) + path(f'M{x-10} {y}L{x+w/2} {y-70}L{x+w+10} {y}Z', '#6f91a8')
        for xx in range(x+18, x+w-15, 40):
            s += rect(xx, y+28, 17, 30, '#e9e6cf')
    s += rect(644, 110, 15, 389, '#f7f3ec') + rect(389, 286, 542, 14, '#f7f3ec')
    s += rect(346, 500, 631, 33, '#92a8b2', 7)
    s += path('M330 70L455 70C417 235 441 326 373 504L297 504C345 350 315 239 330 70Z', '#dba5b0')
    s += path('M957 70L1040 70C1018 250 1120 337 1043 508L935 508C997 310 918 254 957 70Z', '#e9b6ba')
    for x in [347, 380, 982, 1010]:
        s += path(f'M{x} 90Q{x-15} 260 {x+2} 400', stroke='#c991a1', width=4)
    s += ellipse(756, 514, 110, 17, '#b5916d')
    s += ellipse(755, 481, 82, 39, '#d99151') + circle(817, 456, 36, '#d99151')
    s += path('M794 433L795 408L815 426M827 426L847 409L845 445', '#d99151')
    s += path('M710 476C676 438 720 415 740 447', stroke='#bd7540', width=13)
    s += path('M783 470l-9 18M767 466l-10 18M749 463l-10 18', stroke='#b7723d', width=5)
    s += line(803, 458, 810, 458, '#493c31', 3) + line(826, 458, 833, 458, '#493c31', 3)
    s += path('M816 468l5 0', stroke='#735340', width=3)
    s += rect(112, 601, 170, 163, '#9d6577', 8) + rect(100, 584, 194, 30, '#b87e8c', 6)
    for x, y, scale, ang, col in [(187, 590, 1.4, -35, '#3c756c'), (212, 587, 1.65, 13, '#538b76'), (232, 588, 1.15, 54, '#7eaa80')]:
        s += leaf(x, y, scale, ang, col)
    s += ellipse(964, 649, 205, 41, '#738d9b') + rect(808, 648, 24, 152, '#738d9b')
    s += group(rect(842, 596, 156, 30, '#e9b6ba')+rect(850, 621, 160, 15, '#f6f3e7')+line(924, 598, 924, 629, '#bc7a89', 2), 'rotate(-8 910 615)')
    s += rect(1040, 570, 60, 61, '#edf3e5', 8) + path('M1100 580C1141 572 1141 626 1100 620', stroke='#edf3e5', width=12)
    s += ellipse(1070, 573, 30, 7, '#9d7053')
    return s


def window_detail():
    s = circle(910, 150, 58, '#f0d184')
    for x, y, w, h, col in [(0, 420, 270, 380, '#7399b5'), (930, 320, 270, 480, '#e8c4be'), (330, 510, 250, 290, '#84a7b9'), (615, 555, 220, 245, '#91b5bd')]:
        s += rect(x, y, w, h, col) + path(f'M{x} {y}L{x+w/2} {y-100}L{x+w} {y}Z', '#536e8f')
        for xx in range(x+45, x+w-35, 65):
            s += rect(xx, y+55, 30, 55, '#eff0dc')
    s += path('M80 310Q610 420 1110 220', stroke='#526575', width=5)
    for x, y, col in [(330, 345, '#edb9c3'), (505, 360, '#fff3d5'), (685, 337, '#839dba')]:
        s += path(f'M{x} {y}l-35 25 18 50 22-12 0 102 110 0 0-102 20 12 18-50-35-25-30 14-50-14Z', col)
        s += line(x+20, y+5, x+20, y-9, '#b78960', 7) + line(x+80, y+5, x+80, y-9, '#b78960', 7)
    s += path('M390 178q20-30 40 0q20-30 40 0M640 125q15-23 30 0q15-23 30 0', stroke='#506778', width=5)
    s += text(70, 720, '风经过的时候，屋顶也会说话。', 26, '#f8f7ef')
    return s


def boat(x, y, scale=1):
    s = path('M-150 0L135 0L72 80L-75 80Z', '#faf7e8')
    s += path('M-150 0L-25-95L135 0Z', '#f8f0d2') + path('M-25-95L-25 0L135 0Z', '#e9bdaf')
    s += path('M-150 0L-25 42L135 0', stroke='#b7b2a4', width=3)
    return group(s, f'translate({x} {y}) scale({scale})')


def tide_cover():
    s = circle(835, 166, 78, '#f2d184') + path('M120 228q34-28 67 0M989 273q35-24 70 0', stroke='#ad8d9b', width=5)
    for y, col, amp in [(330, '#85b6bd', 45), (430, '#5e97a8', 35), (540, '#397b90', 35), (660, '#276173', 20)]:
        s += path(f'M0 {y}Q160 {y-amp} 320 {y+amp}T640 {y}T960 {y-amp}T1200 {y}V800H0Z', col)
    s += path('M0 459q130-60 260 0t260 0M790 654q130-60 260 0', stroke='#d2e7de', width=8)
    s += path('M20 375Q150 280 289 375Z', '#638b72')
    s += path('M122 331L142 139L202 139L222 331Z', '#fbefd6')
    s += path('M136 192h72l4 38h-80ZM129 268h85l4 32h-93Z', '#bc7182')
    s += rect(137, 110, 71, 35, '#516b86') + path('M128 109L172 74L216 109Z', '#516b86')
    s += boat(715, 475, 1.35)
    s += path('M662 627q50-17 105 0M582 650q120-15 215 0', stroke='#b9d8d6', width=6)
    return s


def tide_detail():
    s = ''
    for i, bg in enumerate(['#e5b8bd', '#263c63', '#a9ced0']):
        x = 60+i*365
        s += rect(x, 80, 330, 630, bg, 160)
        s += rect(x, 460, 330, 250, ['#538ea2', '#395d83', '#548d94'][i], 0)
        for yy in [490, 550, 610]:
            s += path(f'M{x+25} {yy}q70-25 140 0t140 0', stroke='#d4e4db', width=3)
        s += boat(x+170, 460, .65)
        if i == 0:
            s += rect(x+60, 250, 45, 210, '#f3e5c7') + path(f'M{x+46} 250L{x+82} 215L{x+117} 250Z', '#5b718d')
            s += text(x+100, 750, '离港', 28)
        elif i == 1:
            s += circle(x+150, 230, 48, '#f9e3a9') + circle(x+175, 215, 43, bg)
            for xx, yy in [(70,180),(250,290),(100,330),(240,150)]:
                s += circle(x+xx, yy, 4, '#e9d9ed')
            s += text(x+100, 750, '夜航', 28)
        else:
            s += path(f'M{x+230} 485h100v28h-100z', '#c09b79') + line(x+255, 505, x+255, 650, '#a97d62', 16)
            s += path(f'M{x+70} 220q20-25 40 0q20-25 40 0', stroke='#496c80', width=4)
            s += text(x+100, 750, '抵达', 28)
    return s


def bicycle(x, y, scale=1):
    s = ''
    for xx in [-95, 115]:
        s += circle(xx, 80, 68, '#35596c') + circle(xx, 80, 55, '#d2e2e7')
        for angle in range(0,180,30):
            a = math.radians(angle)
            s += line(xx-53*math.cos(a), 80-53*math.sin(a), xx+53*math.cos(a), 80+53*math.sin(a), '#829da7', 2)
    s += path('M-95 80L-30-25L20 80L-95 80M-30-25L82-25L20 80M82-25L115 80M82-25L76-55L114-65', stroke='#b55366', width=12)
    s += line(-45, -37, -8, -37, '#35596c', 12)
    s += path('M-25-40L-4-124L45-125L63-43L25-24Z', '#eac766')
    s += circle(24, -160, 24, '#eab9a2') + path('M-7-160q28-48 61 0Z', '#dfb954')
    s += path('M0-110L-23-53L22 22M43-106L78-55', stroke='#e9c76b', width=18)
    s += line(22, 22, 8, 45, '#36516e', 14)
    s += rect(-143, -33, 58, 54, '#b55366', 5) + rect(-136, -21, 46, 26, '#f5e8d3')
    return group(s, f'translate({x} {y}) scale({scale})')


def rain_cover():
    s = rect(0, 620, 1200, 180, '#83a8bc')
    for x,y,w,h,col in [(45,245,285,375,'#dcb2b7'), (395,170,330,450,'#9bbbba'), (815,300,300,320,'#cebfa7')]:
        s += rect(x, y, w, h, col) + path(f'M{x-25} {y}L{x+w/2} {y-110}L{x+w+25} {y}Z', '#5c7592')
        s += rect(x+w-92, y+h-150, 62, 150, '#536f82')
        for xx in range(x+30, x+w-70, 95):
            s += rect(xx, y+60, 50, 74, '#f4dc9b', 4) + line(xx+25,y+60,xx+25,y+134,'#a99d8e',4)
    for row in range(5):
        for col in range(14):
            x=25+col*88+(row%2)*24; y=45+row*131
            s += line(x,y,x-16,y+41,'#d8e6ec',3)
    s += ellipse(569, 760, 246, 18, '#5b88a1') + bicycle(560, 642, 1.07)
    s += ellipse(1010,710,100,10,'#bad2db') + ellipse(173,670,65,8,'#bad2db')
    return s


def rain_detail():
    s = text(70,90,'雨天邮差 / 角色与道具',30,'#39596c',700)
    s += rect(55,140,570,575,'#ccdee7',14) + bicycle(355,487,1.45)
    s += rect(675,140,465,260,'#e5c2c1',14)
    s += path('M758 280Q900 130 1055 280Z','#497287') + path('M758 280q45-42 85 0q60-42 115 0q55-42 97 0',stroke='#e1eceb',width=4)
    s += path('M907 280v88q0 35 32 18',stroke='#6d6f77',width=10)
    s += rect(675,440,465,275,'#d5ddc9',14)
    s += rect(751,498,305,162,'#f8f1d9',10) + path('M751 498L904 597L1056 498M751 660l115-93M1056 660l-115-93',stroke='#c0a88c',width=4)
    s += rect(1000,514,38,42,'#b8c4b6') + text(730,750,'一封信，三样随身的小东西。',23,'#526b77')
    return s


def garden_cover():
    s = path('M0 630Q200 550 400 640T800 600T1200 645V800H0Z','#b9cba6')
    s += path('M420 800Q535 590 890 468L941 493Q621 640 632 800Z','#e9e1cb')
    s += rect(756,478,260,30,'#75968d',8) + rect(790,335,30,144,'#75968d') + rect(961,335,30,144,'#75968d')
    s += rect(790,335,201,28,'#75968d',6) + rect(783,504,23,173,'#75968d') + rect(963,504,23,173,'#75968d')
    for px,py,ps in [(212,687,1),(538,577,.68),(1073,702,.7)]:
        s += path(f'M{px-80*ps} {py-110*ps}h{160*ps}l{-20*ps} {120*ps}h{-120*ps}Z','#c78f9c')
        for j,(ang,sc,col) in enumerate([(-42,1.3,'#467b69'),(4,1.5,'#65946f'),(43,1.1,'#86ab7b')]):
            s += leaf(px,py-115*ps,sc*ps,ang,col)
    for x,y in [(610,345),(705,268),(383,235)]:
        s += path(f'M{x} {y+140}L{x} {y}',stroke='#6b956f',width=5)
        for a in range(0,360,60):
            s += ellipse(x+23*math.cos(math.radians(a)),y+23*math.sin(math.radians(a)),19,15,'#edc3c5')
        s += circle(x,y,15,'#d2aa55')
    s += ellipse(903,706,29,21,'#f8f5e6') + circle(930,690,17,'#f8f5e6') + path('M946 690l18 7-18 5Z','#c99d62')
    s += line(904,725,904,743,'#9b8c6c',3)+line(920,725,920,743,'#9b8c6c',3)
    s += path('M150 150q75-47 142 0M797 151q73-34 154 0',stroke='#d3ddc9',width=14)
    return s


def garden_detail():
    s = ''
    for i,(bg,label) in enumerate([('#dde4cd','春'),('#b7d0c0','夏'),('#ead7b9','秋'),('#d3e0eb','冬')]):
        x=50+i*290
        s += rect(x,75,255,600,bg,125)+path(f'M{x+73} 535h110l-17 105h-75Z','#bd8b98')
        s += line(x+128,535,x+128,320,'#547768',5)
        if i < 2:
            s += leaf(x+129,455,.72,-50,'#638e6d')+leaf(x+131,398,.62,45,'#86aa7b')
            if i==0:
                for a in range(0,360,60):
                    s += circle(x+128+24*math.cos(math.radians(a)),294+24*math.sin(math.radians(a)),18,'#e6a6b6')
                s += circle(x+128,294,13,'#e2b867')
            else:
                s += leaf(x+127,354,.85,5,'#3d7c68')
        elif i==2:
            s += line(x+128,430,x+75,384,'#547768',4)+line(x+128,365,x+177,327,'#547768',4)
            s += leaf(x+207,472,.52,125,'#c69f55')+leaf(x+67,602,.5,210,'#cfb36e')
        else:
            s += line(x+128,430,x+75,384,'#547768',4)+line(x+128,365,x+177,327,'#547768',4)
            s += path(f'M{x+73} 535q55-30 110 0v15h-110Z','#f6f7ee')
            for xx,yy in [(65,265),(190,415),(87,470),(187,230)]:
                s += circle(x+xx,yy,7,'#f6f7ee')
        s += text(x+108,738,label,32)
    return s


def theatre_mark(x,y,scale=1,color='#fdf9f0'):
    return group(path('M0 92L55 0L82 47L140 0L200 92M22 92L82 47L137 92M82 47L108 0',stroke=color,width=12),f'translate({x} {y}) scale({scale})')


def theatre_cover():
    s=rect(0,0,1200,800,'#ddd6e9')+rect(74,58,694,683,'#32294f')+path('M76 66L212 58L765 604L765 741L629 741Z','#d58cac')
    s+=theatre_mark(185,254,2.2)+text(130,165,'折光剧场',57,'#fbf5eb',700)+text(130,660,'一束光，另一种相遇。',26,'#fbf5eb')
    s+=text(131,210,'Zheguang Theatre',22,'#e9bfd5')+text(570,685,'2026',26,'#fbf5eb')
    for i,col in enumerate(['#f6edf1','#32294f']):
        y=154+i*273
        s+=group(rect(815,y,298,218,col)+theatre_mark(841,y+31,.5,'#32294f' if i==0 else '#e9bfd5')+text(843,y+138,'折光 / 入场券',22,'#32294f' if i==0 else '#f6edf1',700)+text(842,y+182,'A 07        19:30',18,'#32294f' if i==0 else '#e9bfd5'),'rotate(5 965 400)')
    return s


def theatre_detail():
    s=text(60,80,'折光剧场 / 识别与应用',30,'#32294f',700)
    s+=rect(60,130,470,600,'#ddd6e9')+theatre_mark(145,225,1.5,'#32294f')+theatre_mark(147,470,.7,'#32294f')+theatre_mark(360,490,.4,'#a56c8d')
    s+=text(90,680,'标志在大、小尺寸中的结构',21,'#655574')
    s+=rect(590,130,275,405,'#32294f')+path('M590 130L655 130L865 455L865 535L816 535Z','#d58cac')+theatre_mark(645,298,.78)+text(625,200,'折光',47,'#fdf9f0',700)
    s+=rect(915,130,225,405,'#e9bfd5')+theatre_mark(947,308,.7,'#32294f')+text(941,193,'节目册',34,'#32294f',700)
    s+=rect(590,580,550,150,'#ddd6e9')+theatre_mark(617,619,.52,'#32294f')+text(787,629,'折光 / 入场券',24,'#32294f',700)+text(787,680,'A 07    19:30',24,'#655574')
    return s


def hill_mark(x,y,scale=1,color='#f6efd8'):
    return group(path('M0 65Q42-13 84 65Q119 9 170 65',stroke=color,width=10),f'translate({x} {y}) scale({scale})')


def cafe_cover():
    s=ellipse(378,682,210,26,'#aec0aa')+ellipse(790,672,150,25,'#aec0aa')
    s+=group(path('M220 142H522L552 679H202Z','#6a4b3c')+rect(248,279,237,250,'#e0e6cb',3)+hill_mark(281,305,1,'#6a4b3c')+text(291,460,'丘原',55,'#6a4b3c',700)+text(281,498,'Qiuyuan Coffee',20,'#6a4b3c'),'rotate(-5 370 410)')
    s+=path('M662 350h242l-32 309h-177Z','#fcf9ee')+ellipse(783,346,129,27,'#6a4b3c')+ellipse(783,340,113,15,'#84624a')
    s+=path('M677 455h211l-10 99h-191Z','#7b9273')+hill_mark(722,465,.72)
    s+=group(rect(927,111,210,333,'#f7f5e6')+hill_mark(962,145,.8,'#6a4b3c')+text(960,285,'丘原菜单',27,'#6a4b3c',700)+line(957,323,1099,323,'#7b9273',3)+line(957,352,1099,352,'#7b9273',3)+line(957,382,1060,382,'#7b9273',3),'rotate(7 1030 270)')
    s+=text(705,746,'在街角，停一会儿。',26,'#4f654c')
    return s


def cafe_detail():
    s=text(60,80,'丘原咖啡 / 包装与日常应用',30,'#6a4b3c',700)
    s+=rect(60,135,420,590,'#dbe4c9')+hill_mark(159,218,1.4,'#6a4b3c')+text(158,408,'丘原',68,'#6a4b3c',700)
    for i,col in enumerate(['#6a4b3c','#7b9273','#f8f4e6']):
        s+=rect(104+i*112,560,93,108,col)
    for x,w,h in [(540,176,359),(746,145,280)]:
        s+=path(f'M{x} 206h{w}l12 {h}h{-w-24}Z','#6a4b3c')+rect(x+18,281,w-36,155,'#e0e6cb')+hill_mark(x+33,306,.6,'#6a4b3c')+text(x+35,400,'丘原',31,'#6a4b3c',700)
    s+=rect(944,135,210,590,'#f8f4e6')+text(977,200,'丘原菜单',28,'#6a4b3c',700)+hill_mark(978,236,.7,'#6a4b3c')
    for i,value in enumerate(['手冲咖啡','牛奶咖啡','当日烘焙','散步套餐']):
        s+=text(977,376+i*78,value,23,'#6a4b3c')+line(976,405+i*78,1125,405+i*78,'#afb99e',2)
    s+=text(538,680,'同一丘线，适应不同尺寸。',23,'#6a4b3c')
    return s


def book_shape(x,y,w,h,color,stroke='#202039'):
    return path(f'M{x} {y}q{w/4} {-h/5} {w/2} 0q{w/4} {-h/5} {w/2} 0v{h}q{-w/4} {-h/5} {-w/2} 0q{-w/4} {-h/5} {-w/2} 0Z',color,stroke,4)+line(x+w/2,y,x+w/2,y+h,stroke,4)


def book_cover():
    s=group(rect(60,63,480,671,'#ef9068')+text(98,160,'行间',87,'#272235',700)+text(98,214,'独立出版主题展',25,'#272235')+book_shape(123,303,339,263,'#f0b6a0')+text(105,678,'阅读从空白处开始。',25,'#272235'),'rotate(-3 300 390)')
    s+=group(rect(612,130,525,540,'#c4b7ed')+text(651,214,'行间 / 阅读地图',35,'#272235',700)+book_shape(679,318,390,230,'#e1d9f2')+line(787,140,787,653,'#9c8ec3',2)+line(962,140,962,653,'#9c8ec3',2),'rotate(6 874 400)')
    for yy in [395,431,467]:
        s+=line(723,yy,837,yy,'#272235',7)+line(917,yy,1028,yy,'#272235',7)
    return s


def book_detail():
    s=text(60,78,'行间书展 / 版式规则与应用',30,'#272235',700)
    s+=rect(60,126,380,602,'#ef9068')+text(97,223,'行间',69,'#272235',700)+book_shape(111,345,280,211,'#f0b6a0')+text(97,680,'独立出版主题展',23,'#272235')
    s+=rect(492,126,648,350,'#c4b7ed')+text(528,190,'行间 / 日程折页',28,'#272235',700)
    for x in [705,921]:
        s+=line(x,144,x,455,'#9386b5',2)
    for row in range(4):
        for col in range(3):
            s+=rect(527+col*208,233+row*50,145,8,'#665d89')
    s+=rect(492,531,280,197,'#272235')+text(525,618,'B 12',58,'#c4b7ed',700)+text(528,681,'图像与手工书',23,'#f9f5ec')
    s+=rect(821,531,319,197,'#f0b6a0')+book_shape(875,581,212,95,'#ef9068')
    return s


def arrow(x,y,scale=1,col='#f29467'):
    return group(path('M0 35H120M88 0L124 35L88 70',stroke=col,width=16),f'translate({x} {y}) scale({scale})')


def way_cover():
    s=rect(60,575,1090,145,'#c3d4e1')+path('M0 670Q450 540 1200 635V800H0Z','#adc7da')
    s+=rect(150,68,236,650,'#184d8a')+path('M172 93q75 145 10 238q-30 61 100 172',stroke='#f6f7ee',width=10)
    s+=text(188,559,'渡口',61,'#f6f7ee',700)+text(189,603,'Dukou',26,'#bfd7ed')
    s+=rect(475,221,510,133,'#f7f7ec')+arrow(840,252,.78)+text(514,277,'滨水步道',38,'#184d8a',700)+text(515,317,'Riverside Walk   300 m',24,'#184d8a')
    s+=rect(475,378,510,133,'#184d8a')+arrow(500,413,.68)+text(652,436,'公共休息区',35,'#f7f7ec',700)+text(650,475,'Rest Area   120 m',24,'#c3d7ea')
    s+=rect(702,512,28,208,'#547fa1')+rect(449,575,210,111,'#f7f7ec')+path('M480 609h30v50h-30Z','#184d8a')+circle(495,596,11,'#184d8a')
    s+=text(529,649,'步行',26,'#184d8a')
    return s


def way_detail():
    s=text(60,78,'渡口公共标识 / 方向与信息层级',30,'#184d8a',700)
    s+=rect(60,125,464,592,'#184d8a')+text(100,204,'渡口 / 步道示意',32,'#f7f7ec',700)
    s+=path('M105 620Q440 562 325 390T441 269',stroke='#a9c9df',width=64)
    s+=path('M154 647L228 529L217 401L389 269',stroke='#f7f7ec',width=7)
    for x,y in [(154,647),(228,529),(217,401),(389,269)]:
        s+=circle(x,y,12,'#f29467')
    s+=text(104,691,'地图仅为虚构设计示意',21,'#c3d7ea')
    s+=rect(575,125,565,178,'#d8e7ed')+text(607,190,'滨水步道',38,'#184d8a',700)+text(609,237,'Riverside Walk',24,'#184d8a')+arrow(930,178,.95)
    s+=rect(575,344,565,178,'#184d8a')+text(607,409,'公共休息区',38,'#f7f7ec',700)+text(609,457,'Rest Area',24,'#c3d7ea')+arrow(930,397,.95)
    s+=rect(575,563,565,154,'#d8e7ed')
    for x in [640,830,1020]:
        s+=circle(x,598,12,'#184d8a')+line(x,620,x,664,'#184d8a',15)+line(x,664,x-20,691,'#184d8a',8)+line(x,664,x+20,691,'#184d8a',8)
    return s


def phase(x,y,r,angle,col,width=3):
    a=math.radians(angle); b=a+math.pi*1.35
    return path(f'M{x+r*math.cos(a):.2f} {y+r*math.sin(a):.2f}A{r} {r} 0 1 1 {x+r*math.cos(b):.2f} {y+r*math.sin(b):.2f}',stroke=col,width=width)


def phase_cover():
    s=''
    for row in range(8):
        for col in range(12):
            x=94+col*92; y=80+row*92; a=(col*27+row*43)%360
            s+=phase(x,y,28,a,'#8ddce6',2.6)+phase(x+7,y-4,20,a+80,'#c7bcff',2.3)+phase(x-5,y+5,12,a+155,'#ff9bab',2)
            s+=circle(x,y,2,'#788aa8')
    return s


def phase_detail():
    s=text(60,68,'E-01 / 相位单元放大',24,'#b2bdd7')
    for row in range(3):
        for col in range(3):
            x=216+col*380; y=190+row*230; a=col*44+row*33
            s+=rect(x-145,y-90,290,190,'#1d2641',10)
            s+=phase(x,y,75,a,'#8ddce6',5)+phase(x+15,y-12,53,a+80,'#c7bcff',4)+phase(x-10,y+10,32,a+155,'#ff9bab',4)
    return s


def spectrum_cover():
    s=''
    for i in range(48):
        shift=(i-23.5)*8; col=['#8ddce6','#c7bcff','#ff9bab'][i//16]
        points=[(85,250+shift),(326,157+shift*.5),(500,488+shift*.24),(658,294+shift*.15),(831,583+shift*.36),(1130,495+shift*.74)]
        s+=path('M'+'L'.join(f'{x:.1f} {y:.1f}' for x,y in points),stroke=col,width=2.1,extra='opacity=".86"')
    return s


def spectrum_detail():
    s=text(60,68,'E-02 / 平行、收束、展开',24,'#b2bdd7')
    for panel in range(3):
        x=60+panel*380; s+=rect(x,125,320,540,'#1d2641',10)
        for i in range(16):
            col=['#8ddce6','#c7bcff','#ff9bab'][panel]; off=(i-7.5)*14
            if panel==0:
                d=f'M{x+18} {260+off}L{x+302} {445+off}'
            elif panel==1:
                d=f'M{x+18} {255+off}L{x+177} {470+off*.2}L{x+302} {320+off*.12}'
            else:
                d=f'M{x+18} {400+off*.12}L{x+130} {283+off*.3}L{x+302} {463+off}'
            s+=path(d,stroke=col,width=2.4)
        s+=text(x+115,729,['平行','收束','展开'][panel],25,'#c7bcff')
    return s


def flow_art(x0,y0,width,height,count):
    s=''; obstacles=[(.32,.4),(.61,.62),(.79,.32)]
    for i in range(count):
        y=i/(count-1); points=[]
        for j in range(101):
            x=j/100; yy=y+.022*math.sin(x*math.pi*4+i*.1)
            for ox,oy in obstacles:
                distance=math.exp(-((x-ox)/.135)**2)
                dy=y-oy
                yy+=math.copysign(.105*distance*math.exp(-(dy/.145)**2),dy)
            points.append(f'{x0+x*width:.2f} {y0+yy*height:.2f}')
        s+=path('M'+'L'.join(points),stroke=['#8ddce6','#98bce9','#c7bcff'][i%3],width=1.7,extra='opacity=".7"')
    for ox,oy in obstacles:
        s+=ellipse(x0+ox*width,y0+oy*height,width*.03,height*.082,'#14182c')
    return s


def flow_cover():
    return flow_art(55,95,1090,610,72)


def flow_detail():
    s=text(60,68,'E-03 / 干扰前、局部回旋、路径展开',24,'#b2bdd7')
    for i, center in enumerate([.26,.61,.86]):
        x=60+i*380
        s+=rect(x,126,320,570,'#1d2641',10)
        s+=f'<defs><clipPath id="flow-panel-{i}"><rect x="{x+18}" y="144" width="284" height="534"/></clipPath></defs>'
        s+=f'<g clip-path="url(#flow-panel-{i})">{flow_art(x+160-center*900,184,900,442,72)}</g>'
    return s


def orbit_art(cx,cy,rx,ry,count):
    s=''
    for i in range(count):
        angle=i*180/count
        shape=f'<ellipse cx="{cx}" cy="{cy}" rx="{rx-i*.9}" ry="{ry+i*.8}" fill="none" stroke="{["#8ddce6","#c7bcff"][i%2]}" stroke-width="1.8" opacity=".7" transform="rotate({angle} {cx} {cy})"/>'
        s+=shape
        if i%3==0:
            a=math.radians(i*17); rot=math.radians(angle)
            x=(rx-i*.9)*math.cos(a); y=(ry+i*.8)*math.sin(a)
            s+=circle(f'{cx+x*math.cos(rot)-y*math.sin(rot):.2f}',f'{cy+x*math.sin(rot)+y*math.cos(rot):.2f}',4.5,'#ff9bab')
    return s


def orbit_cover():
    s=''
    for i in range(40):
        s+=circle(34+(i*239)%1130,30+(i*127)%740,1.3,'#7183a2')
    return s+orbit_art(600,400,422,149,24)


def orbit_detail():
    s=text(60,68,'E-04 / 轨道叠加的三个阶段',24,'#b2bdd7')
    for i,count in enumerate([1,6,24]):
        x=225+i*375
        s+=rect(x-163,123,326,540,'#1d2641',10)+orbit_art(x,396,144,55,count)
        s+=text(x-65,719,f'{count} 条轨道',25,'#c7bcff')
    return s


ART = {
    'content/works/window-light': ('风从窗沿经过', '#dce7ed', window_cover, window_detail),
    'content/works/paper-tide': ('纸上潮线', '#e7bcc3', tide_cover, tide_detail),
    'content/projects/rain-notes': ('雨天邮差', '#7e9fb7', rain_cover, rain_detail),
    'content/projects/leaf-atlas': ('庭院四季', '#e8ebd8', garden_cover, garden_detail),
    'variants/editorial/content/works/window-light': ('折光剧场', '#f8f5ed', theatre_cover, theatre_detail),
    'variants/editorial/content/works/paper-tide': ('丘原咖啡', '#d6e1c8', cafe_cover, cafe_detail),
    'variants/editorial/content/projects/rain-notes': ('行间书展', '#f7f2e9', book_cover, book_detail),
    'variants/editorial/content/projects/leaf-atlas': ('渡口公共标识', '#d8e7ed', way_cover, way_detail),
    'variants/archive/content/works/window-light': ('相位花园', '#14182c', phase_cover, phase_detail),
    'variants/archive/content/works/paper-tide': ('折叠频谱', '#14182c', spectrum_cover, spectrum_detail),
    'variants/archive/content/projects/rain-notes': ('流场切片', '#14182c', flow_cover, flow_detail),
    'variants/archive/content/projects/leaf-atlas': ('轨道信号', '#14182c', orbit_cover, orbit_detail),
}


def write_art() -> None:
    for directory, (title, background, cover, detail) in ART.items():
        for filename, drawing in [('cover.svg', cover), ('detail.svg', detail)]:
            body = rect(0,0,1200,800,background)+drawing()
            svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><title>{escape(title)}</title><desc>原创虚构演示作品，不含外部素材。</desc>{body}</svg>\n'
            target = ROOT / directory / filename
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(svg, encoding='utf-8')
    icons = {
        'favicon.svg': rect(0,0,64,64,'#edf3f6',12)+path('M9 39Q22 8 39 30Q50 25 55 39Z','#326b73')+path('M11 48q20-6 42 0',stroke='#326b73',width=4),
        'icons/editorial.svg': rect(0,0,64,64,'#1747e7',0)+path('M12 48L26 15L33 31L49 15L53 48M20 48L33 31L45 48',stroke='#fffdf3',width=5),
        'icons/archive.svg': rect(0,0,64,64,'#14182c',12)+group('<ellipse cx="32" cy="32" rx="24" ry="9" fill="none" stroke="#8ddce6" stroke-width="3"/>','rotate(-35 32 32)')+group('<ellipse cx="32" cy="32" rx="24" ry="9" fill="none" stroke="#c7bcff" stroke-width="3"/>','rotate(35 32 32)')+circle(51,23,4,'#ff9bab'),
    }
    for name, body in icons.items():
        target=ROOT/'static'/name
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">{body}</svg>\n',encoding='utf-8')
    print('Created 24 original scene SVGs and 3 scene icons.')


if __name__ == '__main__':
    write_art()
