'use strict';

RadialMenu.DEFAULT_SIZE = 200;
RadialMenu.DEFAULT_TEXT_SIZE = 38;
RadialMenu.MIN_SECTORS  = 3;
RadialMenu.holder = null;


function RadialMenu(params) {
    var self = this;

    self.parent  = params.parent  || [];

    self.size      = params.size    || RadialMenu.DEFAULT_SIZE;
    self.textSize  = params.textSize    || RadialMenu.DEFAULT_TEXT_SIZE;
    self.onClick   = params.onClick || null;
    self.allItems = params.allItems ? params.allItems : [];
	self.posX		= params.posX || 0;
	self.posY		= params.posY || 0;
	self.type		= params.type;
	self.target		= params.target || null;
	self.depth		= 0;

	self.menuItems = params.allItems[self.depth] ? params.allItems[self.depth] : [];

    self.radius      = 50;
    self.innerRadius = self.radius * 0.4;
    self.sectorSpace = self.radius * 0.06;
    self.sectorCount = Math.max(self.menuItems.length, RadialMenu.MIN_SECTORS);
    self.closeOnClick = params.closeOnClick !== undefined ? !!params.closeOnClick : false;

    self.scale       = 1;
    self.holder      = null;
    self.parentMenu  = [];
    self.higherMenu  = [];
    self.parentItems = [];
    self.levelItems  = null;

    self.createHolder();
    self.addIconSymbols();

    self.currentMenu = null;
    document.addEventListener('wheel', self.onMouseWheel.bind(self));
    document.addEventListener('keydown', self.onKeyDown.bind(self));
}


RadialMenu.prototype.open = function () {
    var self = this;
    if (!self.currentMenu) {
        self.currentMenu = self.createMenu('menu ' +self.type+ ' inner', self.menuItems, false);
        self.holder.appendChild(self.currentMenu);

        // wait DOM commands to apply and then set class to allow transition to take effect
        RadialMenu.nextTick(function () {
            self.currentMenu.setAttribute('class', self.type ? 'menu ' + self.type : 'menu');
        });
    }
};


RadialMenu.prototype.close = function () {
    var self = this;

    if (self.currentMenu) {
		
        var parentMenu;
        while (parentMenu = self.parentMenu.pop()) {
            parentMenu.remove();
        }
        self.parentItems = [];
		
		var higherMenu;
        while (higherMenu = self.higherMenu.pop()) {
            higherMenu.remove();
        }

		self.currentMenu.setAttribute('class', 'menu ' +self.type+ ' inner');
		setTimeout(() => {
			if(self.currentMenu)
				self.currentMenu.remove();
			self.currentMenu = null;
			if(self.holder)
				self.holder.remove();
		}, 200);
	}
};

RadialMenu.prototype.getParentMenu = function () {
    var self = this;
    if (self.parentMenu.length > 0) {
        return self.parentMenu[self.parentMenu.length - 1];
    } else {
        return null;
    }
};

RadialMenu.prototype.getHigherMenu = function () {
    var self = this;
    if (self.higherMenu.length > 0) {
        return self.higherMenu[self.higherMenu.length - 1];
    } else {
        return null;
    }
};

RadialMenu.prototype.createHolder = function () {
    var self = this;

    self.holder = document.createElement('div');
    self.holder.className = 'menuHolder';
    self.holder.style.width  = self.size + 'px';
    self.holder.style.height = self.size + 'px';
    self.holder.style.left = self.posX-(self.size/2) + 'px';
    self.holder.style.top = self.posY-(self.size/2) + 'px';

	if(RadialMenu.holder != null)
		RadialMenu.holder.remove();
    RadialMenu.holder = self.parent.appendChild(self.holder);
};

RadialMenu.prototype.showNestedMenu = function (item) {
    var self = this;
    self.parentMenu.push(self.currentMenu);
    self.parentItems.push(self.levelItems);
    self.currentMenu = self.createMenu('menu inner', item.items, true);
    self.holder.appendChild(self.currentMenu);

    RadialMenu.nextTick(function () {
        self.getParentMenu().setAttribute('class', 'menu outer');
        self.currentMenu.setAttribute('class', self.type ? 'menu ' + self.type : 'menu');
    });
};

RadialMenu.prototype.showNextDepth = function (items) {
    var self = this;

    self.higherMenu.push(self.currentMenu);
    self.currentMenu = self.createMenu('menu ' +self.type+ ' inner', items, false);
    self.holder.appendChild(self.currentMenu);

    RadialMenu.nextTick(function () {
        self.getHigherMenu().setAttribute('class', 'menu ' +self.type+ ' outer');
        self.currentMenu.setAttribute('class', self.type ? 'menu ' + self.type : 'menu');
    });
};


RadialMenu.prototype.returnToParentMenu = function () {
    var self = this;
    self.getParentMenu().setAttribute('class', self.type ? 'menu ' + self.type : 'menu');
    RadialMenu.setClassAndWaitForTransition(self.currentMenu, 'menu ' +self.type+ ' inner').then(function () {
        self.currentMenu.remove();
        self.currentMenu = self.parentMenu.pop();
        self.levelItems = self.parentItems.pop();
    });
};

RadialMenu.prototype.handleClick = function () {
    var self = this;

    var selectedIndex = self.getSelectedIndex();
    if (selectedIndex >= 0) {
        var item = self.levelItems[selectedIndex];
        if (item.items) {
            self.showNestedMenu(item);
        } else {
            if (self.onClick) {
                self.onClick(self.target,self.type,item);
                if (self.closeOnClick) {
                    self.close();
                }
            }
        }
    }
};


RadialMenu.prototype.handleCenterClick = function () {
    var self = this;
    if (self.parentItems.length > 0) {
        self.returnToParentMenu();
    } else {
        self.close();
    }
};


RadialMenu.prototype.createCenter = function (svg, title, icon, size) {
    var self = this;
    size = size || 8;
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'center');

    var centerCircle = self.createCircle(0, 0, self.innerRadius - self.sectorSpace / 3);
    g.appendChild(centerCircle);
	
    if (title) {
        var text = self.createText(0,0, title);
        g.appendChild(text);
    }

    if (icon) {
        var use = self.createUseTag(0,0, icon);
        use.setAttribute('width', size);
        use.setAttribute('height', size);
        use.setAttribute('transform', 'translate(-' + RadialMenu.numberToString(size / 2) + ',-' + RadialMenu.numberToString(size / 2) + ')');
        g.appendChild(use);
    }

    svg.appendChild(g);
};


RadialMenu.prototype.getIndexOffset = function () {
    var self = this;
    if (self.levelItems.length < self.sectorCount) {
        switch (self.levelItems.length) {
            case 1:
                return -2;
            case 2:
                return -2;
            case 3:
                return -2;
            default:
                return -1;
        }
    } else {
        return -1;
    }

};


RadialMenu.prototype.createMenu = function (classValue, levelItems, nested) {
    var self = this;

    self.levelItems = levelItems;

    self.sectorCount = Math.max(self.levelItems.length, RadialMenu.MIN_SECTORS);
    self.scale       = self.calcScale();

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', classValue);
    svg.setAttribute('viewBox', '-50 -50 100 100');
    svg.setAttribute('width', self.size);
    svg.setAttribute('height', self.size);

    var angleStep   = 360 / self.sectorCount;
    var angleShift  = angleStep / 2 + 270;

    var indexOffset = self.getIndexOffset();

    for (var i = 0; i < self.sectorCount; ++i) {
        var startAngle = angleShift + angleStep * i;
        var endAngle   = angleShift + angleStep * (i + 1);

        var itemIndex = RadialMenu.resolveLoopIndex(self.sectorCount - i + indexOffset, self.sectorCount);
        var item;
        if (itemIndex >= 0 && itemIndex < self.levelItems.length) {
            item = self.levelItems[itemIndex];
        } else {
            item = null;
        }

        self.appendSectorPath(startAngle, endAngle, svg, item, itemIndex);
    }

    if (nested) {
        self.createCenter(svg, '', '#return', 8);
    } else {
        self.createCenter(svg, '', '#close', 7);
    }

    svg.addEventListener('mousedown', function (event) {
        var className = event.target.parentNode.getAttribute('class').split(' ')[0];
        switch (className) {
            case 'sector':
                var index = parseInt(event.target.parentNode.getAttribute('data-index'));
                if (!isNaN(index)) {
                    self.setSelectedIndex(index);
                }
                break;
            default:
        }
    });

    svg.addEventListener('click', function (event) {
        var className = event.target.parentNode.getAttribute('class').split(' ')[0];
        switch (className) {
            case 'sector':
                self.handleClick();
                break;
            case 'center':
                self.handleCenterClick();
                break;
            default:
        }
    });
    return svg;
};


RadialMenu.prototype.selectDepth = function (indexDelta) {
    var self = this;
	const min = 0;
	const max = self.allItems.length - 1;
	self.depth += indexDelta;
	self.depth = self.depth < min ? max : self.depth;
	self.depth = self.depth > max ? min : self.depth;
    self.showNextDepth(self.allItems[self.depth]);
};



RadialMenu.prototype.lock = function () {
	var self = this;
	self.locked = true;
	setTimeout(() => {self.locked = false;}, 200);
};


RadialMenu.prototype.onKeyDown = function (event) {
    var self = this;
    if (self.currentMenu) {
        switch (event.key) {
            case 'Escape':
				if(self.locked) {event.preventDefault(); return;} else self.lock();
                self.handleCenterClick();
                event.preventDefault();
                break;
            case 'ArrowRight':
            case 'ArrowUp':
				if(self.locked) {event.preventDefault(); return;} else self.lock();
                self.selectDepth(1);
                event.preventDefault();
                break;
            case 'ArrowLeft':
            case 'ArrowDown':
				if(self.locked) {event.preventDefault(); return;} else self.lock();
                self.selectDepth(-1);
                event.preventDefault();
                break;
        }
    }
};


RadialMenu.prototype.onMouseWheel = function (event) {
    var self = this;
    if (self.currentMenu) {
		if(self.locked) return; else self.lock();
        var delta = -event.deltaY;

        if (delta > 0) {
            self.selectDepth(1)
        } else {
            self.selectDepth(-1)
        }
    }
};


RadialMenu.prototype.getSelectedNode = function () {
    var self = this;
    var items = self.currentMenu.getElementsByClassName('selected');
    if (items.length > 0) {
        return items[0];
    } else {
        return null;
    }
};


RadialMenu.prototype.getSelectedIndex = function () {
    var self = this;
    var selectedNode = self.getSelectedNode();
    if (selectedNode) {
        return parseInt(selectedNode.getAttribute('data-index'));
    } else {
        return -1;
    }
};


RadialMenu.prototype.setSelectedIndex = function (index) {
    var self = this;
    if (index >=0 && index < self.levelItems.length) {
        var items = self.currentMenu.querySelectorAll('g[data-index="' + index + '"]');
        if (items.length > 0) {
            var itemToSelect = items[0];
            var selectedNode = self.getSelectedNode();
            if (selectedNode) {
                selectedNode.setAttribute('class', 'sector');
            }
            itemToSelect.setAttribute('class', 'sector selected');
        }
    }
};


RadialMenu.prototype.createUseTag = function (x, y, link) {
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('x', RadialMenu.numberToString(x));
    use.setAttribute('y', RadialMenu.numberToString(y));
    use.setAttribute('width', '10');
    use.setAttribute('height', '10');
    use.setAttribute('fill', 'white');
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', link);
    return use;
};


RadialMenu.prototype.appendSectorPath = function (startAngleDeg, endAngleDeg, svg, item, index) {
    var self = this;

    var centerPoint = self.getSectorCenter(startAngleDeg, endAngleDeg);
    var translate = {
        x: RadialMenu.numberToString((1 - self.scale) * centerPoint.x),
        y: RadialMenu.numberToString((1 - self.scale) * centerPoint.y)
    };

    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform','translate(' +translate.x + ' ,' + translate.y + ') scale(' + self.scale + ')');

    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', self.createSectorCmds(startAngleDeg, endAngleDeg));
    g.appendChild(path);

    if (item) {
        g.setAttribute('class', 'sector');
        if (index == 0) {
            g.setAttribute('class', 'sector selected');
        }
        g.setAttribute('data-id', item.id);
        g.setAttribute('data-index', index);

		var label = self.getDisplayLabel(item);
		if (label) {
            var text = self.createText(centerPoint.x, centerPoint.y, label);
            if (item.icon) {
                text.setAttribute('transform', 'translate(0,8)');
            } else {
                text.setAttribute('transform', 'translate(0,2)');
            }

            g.appendChild(text);
        }

        if (item.icon) {
            var use = self.createUseTag(centerPoint.x, centerPoint.y, item.icon);
            if (label) {
                use.setAttribute('transform', 'translate(-5,-8)');
            } else {
                use.setAttribute('transform', 'translate(-5,-5)');
            }

            g.appendChild(use);
        }

    } else {
        g.setAttribute('class', 'dummy');
    }

    svg.appendChild(g);
};


RadialMenu.prototype.createSectorCmds = function (startAngleDeg, endAngleDeg) {
    var self = this;

    var initPoint = RadialMenu.getDegreePos(startAngleDeg, self.radius);
    var path = 'M' + RadialMenu.pointToString(initPoint);

    var radiusAfterScale = self.radius * (1 / self.scale);
    path += 'A' + radiusAfterScale + ' ' + radiusAfterScale + ' 0 0 0' + RadialMenu.pointToString(RadialMenu.getDegreePos(endAngleDeg, self.radius));
    path += 'L' + RadialMenu.pointToString(RadialMenu.getDegreePos(endAngleDeg, self.innerRadius));

    var radiusDiff = self.radius - self.innerRadius;
    var radiusDelta = (radiusDiff - (radiusDiff * self.scale)) / 2;
    var innerRadius = (self.innerRadius + radiusDelta) * (1 / self.scale);
    path += 'A' + innerRadius + ' ' + innerRadius + ' 0 0 1 ' + RadialMenu.pointToString(RadialMenu.getDegreePos(startAngleDeg, self.innerRadius));
    path += 'Z';

    return path;
};

RadialMenu.prototype.sanitizeForLabel = function (s, maxLen) {
  const str = String(s ?? '')
    .replace(/\r\n?/g, '\n') // normalize CRLF -> LF
    .replace(/\s+/g, ' ')
    .trim();
  return (maxLen && str.length > maxLen) ? (str.slice(0, maxLen - 1) + '…') : str;
};

RadialMenu.prototype.getDisplayLabel = function (item, length = 40) {
  if (!item || typeof item !== 'object') return 'Unknown';
  const s = (x) => this.sanitizeForLabel(x, length);
  return s(item.title) || s(item.data) || 'Unknown';
};

RadialMenu.prototype.createText = function (x, y, title) {
    var self = this;
    var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('x', RadialMenu.numberToString(x));
    text.setAttribute('y', RadialMenu.numberToString(y));
    text.setAttribute('font-size', self.textSize+'%');
    text.textContent = title || ''; // instead of innerHTML
    return text;
};


RadialMenu.prototype.createCircle = function (x, y, r) {
    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx',RadialMenu.numberToString(x));
    circle.setAttribute('cy',RadialMenu.numberToString(y));
    circle.setAttribute('r',r);
    return circle;
};


RadialMenu.prototype.calcScale = function () {
    var self = this;
    var totalSpace = self.sectorSpace * self.sectorCount;
    var circleLength = Math.PI * 2 * self.radius;
    var radiusDelta = self.radius - (circleLength - totalSpace) / (Math.PI * 2);
    return (self.radius - radiusDelta) / self.radius;
};


RadialMenu.prototype.getSectorCenter = function (startAngleDeg, endAngleDeg) {
    var self = this;
    return RadialMenu.getDegreePos((startAngleDeg + endAngleDeg) / 2, self.innerRadius + (self.radius - self.innerRadius) / 2);
};


RadialMenu.prototype.addIconSymbols = function () {
    var self = this;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icons');

    var returnSymbol = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
    returnSymbol.setAttribute('id', 'return');
    returnSymbol.setAttribute('viewBox', '0 0 489.394 489.394');
    var returnPath =   document.createElementNS('http://www.w3.org/2000/svg', 'path');
    returnPath.setAttribute('d', "M375.789,92.867H166.864l17.507-42.795c3.724-9.132,1-19.574-6.691-25.744c-7.701-6.166-18.538-6.508-26.639-0.879" +
        "L9.574,121.71c-6.197,4.304-9.795,11.457-9.563,18.995c0.231,7.533,4.261,14.446,10.71,18.359l147.925,89.823" +
        "c8.417,5.108,19.18,4.093,26.481-2.499c7.312-6.591,9.427-17.312,5.219-26.202l-19.443-41.132h204.886" +
        "c15.119,0,27.418,12.536,27.418,27.654v149.852c0,15.118-12.299,27.19-27.418,27.19h-226.74c-20.226,0-36.623,16.396-36.623,36.622" +
        "v12.942c0,20.228,16.397,36.624,36.623,36.624h226.74c62.642,0,113.604-50.732,113.604-113.379V206.709" +
        "C489.395,144.062,438.431,92.867,375.789,92.867z");
    returnSymbol.appendChild(returnPath);
    svg.appendChild(returnSymbol);

    var closeSymbol = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
    closeSymbol.setAttribute('id', 'close');
    closeSymbol.setAttribute('viewBox', '0 0 41.756 41.756');

    var closePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    closePath.setAttribute('d', "M27.948,20.878L40.291,8.536c1.953-1.953,1.953-5.119,0-7.071c-1.951-1.952-5.119-1.952-7.07,0L20.878,13.809L8.535,1.465" +
        "c-1.951-1.952-5.119-1.952-7.07,0c-1.953,1.953-1.953,5.119,0,7.071l12.342,12.342L1.465,33.22c-1.953,1.953-1.953,5.119,0,7.071" +
        "C2.44,41.268,3.721,41.755,5,41.755c1.278,0,2.56-0.487,3.535-1.464l12.343-12.342l12.343,12.343" +
        "c0.976,0.977,2.256,1.464,3.535,1.464s2.56-0.487,3.535-1.464c1.953-1.953,1.953-5.119,0-7.071L27.948,20.878z");
    closeSymbol.appendChild(closePath);
    svg.appendChild(closeSymbol);

    self.holder.appendChild(svg);
};


RadialMenu.getDegreePos = function (angleDeg, length) {
    return {
        x: Math.sin(RadialMenu.degToRad(angleDeg)) * length,
        y: Math.cos(RadialMenu.degToRad(angleDeg)) * length
    };
};


RadialMenu.pointToString = function (point) {
    return RadialMenu.numberToString(point.x) + ' ' + RadialMenu.numberToString(point.y);
};


RadialMenu.numberToString = function (n) {
    if (Number.isInteger(n)) {
        return n.toString();
    } else if (n) {
        var r = (+n).toFixed(5);
        if (r.match(/\./)) {
            r = r.replace(/\.?0+$/, '');
        }
        return r;
    }
};


RadialMenu.resolveLoopIndex = function (index, length) {
    if (index < 0) {
        index = length + index;
    }
    if (index >= length) {
        index = index - length;
    }
    if (index < length) {
        return index;
    } else {
        return null;
    }
};


RadialMenu.degToRad = function (deg) {
    return deg * (Math.PI / 180);
};

RadialMenu.setClassAndWaitForTransition = function (node, newClass) {
    return new Promise(function (resolve) {
        function handler(event) {
            if (event.target == node && event.propertyName == 'visibility') {
                node.removeEventListener('transitionend', handler);
                resolve();
            }
        }
        node.addEventListener('transitionend', handler);
        node.setAttribute('class', newClass);
    });
};


RadialMenu.nextTick = function (fn) {
    setTimeout(fn, 10);
};




