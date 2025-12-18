class DotPainter {
    constructor() {
        this.canvas = document.getElementById('dotCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.currentColor = '#000000';
        this.brushSize = 1;
        this.isEraser = false;
        this.dotSize = 5;
        this.gridSize = 10;
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
        this.canvasState = null;

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.generateColorPalette();
        this.drawGrid();
        this.saveHistory();
    }

    setupCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    setupEventListeners() {
        // 鼠标事件
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

        // 触摸事件
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));

        // 控制面板事件
        document.getElementById('brushSize').addEventListener('change', (e) => {
            this.brushSize = parseInt(e.target.value);
        });

        document.getElementById('eraserToggle').addEventListener('click', (e) => {
            this.isEraser = e.target.checked;
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearCanvas();
        });

        document.getElementById('undoBtn').addEventListener('click', () => {
            this.undo();
        });

        document.getElementById('redoBtn').addEventListener('click', () => {
            this.redo();
        });

        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveFile();
        });

        document.getElementById('loadBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', this.loadFile.bind(this));

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportPNG();
        });
    }

    generateColorPalette() {
        const colors = [
            '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
            '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
            '#A52A2A', '#008000', '#000080', '#FFC0CB', '#808080'
        ];

        const colorPalette = document.getElementById('colorPalette');
        colors.forEach(color => {
            const colorBtn = document.createElement('button');
            colorBtn.className = 'color-btn';
            colorBtn.style.backgroundColor = color;
            colorBtn.addEventListener('click', () => {
                this.setColor(color);
            });
            colorPalette.appendChild(colorBtn);
        });
    }

    setColor(color) {
        this.currentColor = color;
        this.isEraser = false;
        document.getElementById('eraserToggle').checked = false;
    }

    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.gridSize) * this.gridSize;
        const y = Math.floor((e.clientY - rect.top) / this.gridSize) * this.gridSize;
        this.lastX = x;
        this.lastY = y;
        this.drawDot(x, y);
    }

    draw(e) {
        if (!this.isDrawing) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.gridSize) * this.gridSize;
        const y = Math.floor((e.clientY - rect.top) / this.gridSize) * this.gridSize;

        this.drawLine(this.lastX, this.lastY, x, y);
        this.lastX = x;
        this.lastY = y;
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveHistory();
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }

    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }

    drawDot(x, y) {
        const color = this.isEraser ? '#FFFFFF' : this.currentColor;
        const size = this.isEraser ? this.brushSize : this.brushSize;

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const dotX = x + i * this.gridSize;
                const dotY = y + j * this.gridSize;
                if (dotX < this.canvas.width && dotY < this.canvas.height) {
                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(dotX, dotY, this.dotSize, this.dotSize);
                }
            }
        }
    }

    drawLine(x1, y1, x2, y2) {
        // Bresenham's line algorithm
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? this.gridSize : -this.gridSize;
        const sy = y1 < y2 ? this.gridSize : -this.gridSize;
        let err = dx - dy;

        while (true) {
            this.drawDot(x1, y1);

            if (Math.abs(x1 - x2) < this.gridSize && Math.abs(y1 - y2) < this.gridSize) {
                break;
            }

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x1 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y1 += sy;
            }
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 0.5;

        // 绘制垂直线
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // 绘制水平线
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    clearCanvas() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.saveHistory();
    }

    saveHistory() {
        // 移除历史记录中当前索引之后的所有记录
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        // 保存当前画布状态
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.history.push(imageData);
        this.historyIndex++;

        // 限制历史记录数量
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreCanvas(this.history[this.historyIndex]);
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreCanvas(this.history[this.historyIndex]);
        }
    }

    restoreCanvas(imageData) {
        this.ctx.putImageData(imageData, 0, 0);
        this.drawGrid();
    }

    saveFile() {
        // 保存为LM格式文件
        const dotData = [];
        for (let y = 0; y < this.canvas.height; y += this.gridSize) {
            for (let x = 0; x < this.canvas.width; x += this.gridSize) {
                const pixel = this.ctx.getImageData(x, y, 1, 1).data;
                const color = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;
                if (color !== '#ffffff') {
                    dotData.push({
                        x: Math.floor(x / this.gridSize),
                        y: Math.floor(y / this.gridSize),
                        color: color
                    });
                }
            }
        }

        const lmData = {
            version: '1.0',
            dotSize: this.dotSize,
            gridSize: this.gridSize,
            width: Math.floor(this.canvas.width / this.gridSize),
            height: Math.floor(this.canvas.height / this.gridSize),
            dots: dotData
        };

        const dataStr = JSON.stringify(lmData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dotpainting_${Date.now()}.lm`;
        link.click();
        URL.revokeObjectURL(url);
    }

    loadFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const lmData = JSON.parse(event.target.result);
                this.loadFromLM(lmData);
                this.saveHistory();
            } catch (error) {
                alert('文件格式错误，请选择有效的LM文件');
            }
        };
        reader.readAsText(file);
    }

    loadFromLM(lmData) {
        // 清空画布
        this.clearCanvas();

        // 加载点阵数据
        lmData.dots.forEach(dot => {
            const x = dot.x * this.gridSize;
            const y = dot.y * this.gridSize;
            this.ctx.fillStyle = dot.color;
            this.ctx.fillRect(x, y, this.dotSize, this.dotSize);
        });

        this.drawGrid();
    }

    exportPNG() {
        const url = this.canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `dotpainting_${Date.now()}.png`;
        link.click();
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new DotPainter();
});
