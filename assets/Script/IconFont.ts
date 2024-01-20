/*******************************************************************************
 * 创建: 2022年10月08日
 * 作者: 水煮肉片饭(27185709@qq.com)
 * 描述: 用Atlas图集帧绘制文字，尤其适合绘制数字和英文
 * 1、不增加DrawCall
 *    将字符图片，跟游戏其他图片打包到同一个Atlas图集
 * 2、支持转译字符
 * \n或回车-->换行
 * \t或Tab-->插入1个空格
 * \c-->换色，例如：
 *      浙\cf00\c江\0省——“江”变f00色值
 * \h-->设置字符高度（宽度会等比缩放），例如
 *      江\h80\h苏\0省——“苏”字高度设置为80px
 * \0-->恢复默认值，搭配\c和\h使用
*******************************************************************************/
const MAX_COLORSTR_LENGTH = 6;
const MAX_HEIGHTSTR_LENGTH = 3;
enum AlignH { 左, 中, 右 }
enum AlignV { 上, 中, 下 }
const { ccclass, property, executeInEditMode, menu } = cc._decorator;
@ccclass
@executeInEditMode
@menu('Comp/IconFont')
export default class IconFont extends cc.Component {
    @property
    private _atlas: cc.SpriteAtlas = null;
    @property({ type: cc.SpriteAtlas, displayName: CC_DEV && 'Atlas图集', tooltip: CC_DEV && '文本帧命名规范：字体+ascii码\n例如：\n字体ica数字“0”会读取图集帧“ica48”' })
    private get atlas() { return this._atlas; }
    private set atlas(value: cc.SpriteAtlas) {
        this._atlas = value;
        this.updateContent();
    }
    @property
    private _string: string = '';
    @property({ multiline: true, displayName: CC_DEV && '文本内容', tooltip: CC_DEV && '转译字符表：\n\\n 或 回车--->换行\n\\t 或 Tab --->插入空格，例如：\n“浙江\\t80\\t省”——“江”、“省”之间插入80px空格\n\\c--->设置文本颜色，例如：\n“四\\cff0000\\c川\\0省”——“川”变#ff0000色值\n\\h--->设置文字高度，例如：\n“云\\h60\\h南\\0省”——“南”变60px高\n\\0--->恢复初始值，搭配\\c、\\h使用' })
    get string() { return this._string; }
    set string(value: string) {
        this._string = value.toString();
        this.updateContent();
        this.updateAlignH();
        this.updateAlignV();
    }
    @property
    private _isWrap = false;
    @property({ displayName: CC_DEV && '自动换行' })
    private get isWrap() { return this._isWrap; }
    private set isWrap(value: boolean) {
        this._isWrap = value;
        this.updateContent();
        this.updateAlignH();
        this.updateAlignV();
    }
    @property
    private _fontName = 'ZTA';
    @property({ displayName: CC_DEV && '字体名称' })
    private get fontName() { return this._fontName };
    private set fontName(value: string) {
        this._fontName = value;
        this.atlas = this._atlas;
        this.updateContent();
    }
    @property
    private _fontHeight: number = 40;
    @property({ min: 0, displayName: CC_DEV && '字体高度' })
    private get fontHeight() { return this._fontHeight };
    private set fontHeight(value: number) {
        this._fontHeight = value;
        this.updateContent();
        this.updateAlignH();
        this.updateAlignV();
    }
    @property
    private _charDis: number = 0;
    @property({ displayName: CC_DEV && '字间距' })
    private get charDis() { return this._charDis };
    private set charDis(value: number) {
        this._charDis = value;
        this.updateContent();
        this.updateAlignH();
        this.updateAlignV();
    }
    @property
    private _rowDis: number = 0;
    @property({ displayName: CC_DEV && '行间距' })
    private get rowDis() { return this._rowDis };
    private set rowDis(value: number) {
        this._rowDis = value;
        this.updateContent();
        this.updateAlignV();
    }
    @property
    private _anchorY: number = 0.2;
    @property({ displayName: CC_DEV && '缩放锚点Y', tooltip: CC_DEV && '例如“abp”\n锚点Y在“a”的下边缘才能缩放对齐' })
    private get anchorY() { return this._anchorY };
    private set anchorY(value: number) {
        value = Math.min(value, 1);
        this._anchorY = value;
        this.updateContent();
    }
    @property
    private _alignH = AlignH.中;
    @property({ type: cc.Enum(AlignH), displayName: CC_DEV && '水平对齐' })
    private get alignH() { return this._alignH; }
    private set alignH(value: AlignH) {
        this._alignH = value;
        this.updateAlignH();
    }
    @property
    private _alignV = AlignV.中;
    @property({ type: cc.Enum(AlignV), displayName: CC_DEV && '垂直对齐' })
    private get alignV() { return this._alignV; }
    private set alignV(value: AlignV) {
        this._alignV = value;
        this.updateAlignV();
    }
    private contentNode: cc.Node = null;

    onLoad() {
        this.updateContent();
        this.updateAlignH();
        this.updateAlignV();
        this.node.on(cc.Node.EventType.SIZE_CHANGED, this.updateNodeEvent, this);
        this.node.on(cc.Node.EventType.ANCHOR_CHANGED, this.updateNodeEvent, this);
        this.node.on(cc.Node.EventType.COLOR_CHANGED, this.updateColor, this);
    }

    private updateNodeEvent() {
        this.updateContent();
        this.updateAlignH();
        this.updateAlignV();
    }

    private updateColor() {
        for (let i = this.contentNode.childrenCount - 1; i >= 0; --i) {
            if (this.contentNode.children[i]['isUseNodeColor'] === true) {
                this.contentNode.children[i].color = this.node.color;
            }
        }
    }

    private updateContent() {
        if (this.contentNode === null) {
            this.node.destroyAllChildren();
            this.node.removeAllChildren();
            this.contentNode = this.node.getChildByName('content');
            if (this.contentNode === null) {
                this.contentNode = new cc.Node('content');
                this.contentNode.setParent(this.node);
                this.contentNode.setSiblingIndex(0);
                this.contentNode.anchorX = 0;
                this.contentNode.anchorY = 1;
            }
            this.contentNode['_objFlags'] = 0;
            this.contentNode['_objFlags'] |= cc.Object['Flags'].HideInHierarchy;
            this.contentNode['_objFlags'] |= cc.Object['Flags'].LockedInEditor;
        }
        this.contentNode.width = 0;
        this.contentNode.height = 0;
        let str = this.string;
        let fontHeight = this.fontHeight;
        let rowW = 0;
        let rowH = fontHeight + this.rowDis;
        let tabW = fontHeight * 0.5;          //空格宽度
        let cellX = 0;                        //字符节点X
        let cellY = rowH;                     //字符节点Y
        let color = this.node.color;          //所有字符的默认颜色
        let isUseNodeColor = true;            //如果用\c设置过颜色，则该字符颜色不随节点颜色而改变
        let node = null;
        let spt = null;
        let nodeCnt = 0;                      //统计字符节点数
        for (let i = 0, len = str.length; i <= len; ++i) {
            if (i === len) {
                this.contentNode.width = Math.max(this.contentNode.width, rowW - this.charDis);
                this.contentNode.height = cellY;
                break;
            }
            switch (str[i]) {
                case '\\':
                    if (i === len - 1)
                        break;
                    switch (str[i + 1]) {
                        case 'n':             //\n换行
                            ++i;
                            this.contentNode.width = Math.max(this.contentNode.width, rowW);
                            cellY += rowH;
                            rowW = 0;
                            cellX = 0;
                            continue;
                        case 't':             //\t插入空格
                            ++i;
                            if (this.isWrap && rowW + tabW > this.node.width) {
                                this.contentNode.width = this.node.width;
                                cellY += rowH;
                                rowW = tabW;
                                cellX = rowW;
                            } else {
                                rowW += tabW + this.charDis;
                                cellX = rowW;
                            }
                            continue;
                        case 'c': {             //\c设置颜色
                            let id = str.substring(i + 2, i + 4 + MAX_COLORSTR_LENGTH).indexOf('\\c', 0);
                            if (id === -1) break;
                            if (id !== 3 && id !== 6) break;
                            id += i + 2;
                            color = this.hexToRgb(str.substring(i + 2, id));
                            i = id + 1;
                            isUseNodeColor = false;
                        } continue;
                        case 'h': {             //\h设置高度
                            let id = str.substring(i + 2, i + 4 + MAX_HEIGHTSTR_LENGTH).indexOf('\\h', 0);
                            if (id === -1) break;
                            id += i + 2;
                            let height = parseInt(str.substring(i + 2, id));
                            if (isNaN(height)) break;
                            fontHeight = Math.max(height, 0);
                            tabW = fontHeight * 0.5;
                            i = id + 1;
                        } continue;
                        case '0':             //\0恢复默认
                            color = this.node.color;
                            fontHeight = this.fontHeight;
                            tabW = fontHeight * 0.5;
                            isUseNodeColor = true;
                            ++i;
                            continue;
                    }
                    break;
                case '\n':                    //回车换行
                    this.contentNode.width = Math.max(this.contentNode.width, rowW);
                    cellY += rowH;
                    rowW = 0;
                    cellX = 0;
                    continue;
                case '\t':                    //Tab插入空格
                case ' ':                     //空格
                    if (this.isWrap && rowW + tabW > this.node.width) {
                        this.contentNode.width = this.node.width;
                        cellY += rowH;
                        rowW = tabW;
                        cellX = rowW;
                    } else {
                        rowW += tabW + this.charDis;
                        cellX = rowW;
                    }
                    continue;
            }
            let frameName = `${this.fontName}${str.charCodeAt(i)}`;
            if (this.contentNode.children[nodeCnt]) {          //如果节点已存在
                node = this.contentNode.children[nodeCnt];     //则使用该节点（否则创建新节点）
                if (node.name !== frameName || node.color !== color || node.height !== fontHeight) {//如果节点name、color、height均无变动，则不需要修改
                    node.name = frameName;
                    spt = node.getComponent(cc.Sprite);
                    spt.spriteFrame = this.atlas ? this.atlas.getSpriteFrame(frameName) : null;
                    !spt.spriteFrame && (CC_EDITOR ? cc.warn(`IconFont未在${this.node?.parent?.parent.name}/${this.node?.parent.name}/${this.node.name}找到${frameName}!`) : console.warn(`IconFont未在${this.node?.parent?.parent.name}/${this.node?.parent.name}/${this.node.name}找到${frameName}!`));
                    spt.sizeMode = cc.Sprite.SizeMode.RAW;
                    node.color = color;
                    node['isUseNodeColor'] = isUseNodeColor;
                    node.width = spt.spriteFrame ? node.width * fontHeight / node.height : tabW;
                    node.height = fontHeight;
                }
            } else {
                node = new cc.Node(frameName);
                spt = node.addComponent(cc.Sprite);
                node.setParent(this.contentNode);
                spt.spriteFrame = this.atlas ? this.atlas.getSpriteFrame(frameName) : null;
                !spt.spriteFrame && (CC_EDITOR ? cc.warn(`IconFont未在${this.node?.parent?.parent.name}/${this.node?.parent.name}/${this.node.name}找到${frameName}!`) : console.warn(`IconFont未在${this.node?.parent?.parent.name}/${this.node?.parent.name}/${this.node.name}找到${frameName}!`));
                node.color = color;
                node['isUseNodeColor'] = isUseNodeColor;
                node.width = spt.spriteFrame ? node.width * fontHeight / node.height : tabW;
                node.height = fontHeight;
                node.anchorX = 0;
                node.anchorY = 0;
            }
            if (this.isWrap && rowW + node.width > this.node.width) {//自动换行
                cellY += rowH;
                node.x = 0;
                rowW = node.width + this.charDis;
                cellX = rowW;
                this.contentNode.width = this.node.width;
            } else {
                node.x = cellX;
                rowW += node.width + this.charDis;
                cellX = rowW;
            }
            node.y = this.rowDis * 0.5 - cellY - (node.height - this.fontHeight) * this.anchorY;;
            ++nodeCnt;
        }
        for (let i = this.contentNode.childrenCount - 1; i >= nodeCnt; --i) {    //删除多余节点（例如：string从125设置成13，则1不变，2换成3，5删除）
            this.contentNode.children[i].destroy();
        }
    }

    private updateAlignH() {
        switch (this.alignH) {
            case AlignH.左: this.contentNode.x = -this.node.width * this.node.anchorX; break;
            case AlignH.中: this.contentNode.x = -this.node.width * this.node.anchorX + (this.node.width - this.contentNode.width) * 0.5; break;
            case AlignH.右: this.contentNode.x = -this.node.width * this.node.anchorX + this.node.width - this.contentNode.width; break;
        }
    }

    private updateAlignV() {
        switch (this.alignV) {
            case AlignV.上: this.contentNode.y = -this.node.height * this.node.anchorY + this.node.height; break;
            case AlignV.中: this.contentNode.y = -this.node.height * this.node.anchorY + (this.node.height + this.contentNode.height) * 0.5; break;
            case AlignV.下: this.contentNode.y = -this.node.height * this.node.anchorY + this.contentNode.height; break;
        }
    }

    private hexToRgb(hexColor: string | number): cc.Color {
        if (typeof hexColor === 'number') {
            return cc.color(hexColor & 0xFF, (hexColor >> 8) & 0xFF, (hexColor >> 16) & 0xFF, (hexColor >> 24) & 0xFF);
        }
        hexColor[0] === '#' && (hexColor = hexColor.substring(1));
        switch (hexColor.length) {
            case 6: return cc.color(parseInt('0x' + hexColor.substring(0, 2)), parseInt('0x' + hexColor.substring(2, 4)), parseInt('0x' + hexColor.substring(4, 6)));
            case 3: return cc.color(parseInt('0x' + hexColor.substring(0, 1) + hexColor.substring(0, 1)), parseInt('0x' + hexColor.substring(1, 2) + hexColor.substring(1, 2)), parseInt('0x' + hexColor.substring(2, 3) + hexColor.substring(2, 3)));
        }
        return null;
    }

    protected onDestroy() {
        if (cc.isValid(this.contentNode)) {
            this.contentNode.destroy();
            this.contentNode.removeFromParent();
        }
        this.node.targetOff(this);
    }
}