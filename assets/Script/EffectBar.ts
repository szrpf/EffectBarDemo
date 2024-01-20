/*******************************************************************************
 * 创建:    2022年8月3日
 * 作者:    水煮肉片饭（27185709@qq.com）
 * 描述:    特效进度条
 * 给进度条挂上该组件，进度变化时，进度条会播放动画特效
 * 1、绑定属性后，属性变化，进度条也跟着变化。
 * 2、上限值可以填属性名称，也可以直接填数值。
 * 3、将挂着cc.Label或IconFont组件的节点拖入，会显示进度数字。
 *    可以设置数字显示格式，例如：180/220 或 83.32%
 * 4、setProp重新绑定属性（例如：动态脚本，需在初始化的时候主动调用setProp绑定属性）
 *    setData重置上限值和当前进度（例如：升级后经验上限提高）
*******************************************************************************/
export enum EffectType { 残影, 弹射, 缩放 }
export enum NumberFormat { 几杠几, 百分比 }
const { ccclass, property, menu } = cc._decorator;
@ccclass('BindProperty')
class BindProperty {
    @property({ type: cc.Node, displayName: CC_DEV && '绑定哪个节点' })
    propNode: cc.Node = null;
    @property({ displayName: CC_DEV && '下的哪个脚本' })
    scriptName: string = '';
    @property({ displayName: CC_DEV && '里的哪个属性' })
    propName: string = '';
    @property({ displayName: CC_DEV && '上限值', tooltip: CC_DEV && '可以填属性名称\n也可以直接填数字' })
    propMax: string = '';
}
@ccclass
@menu('Comp/EffectBar')
export default class EffectBar extends cc.Component {
    @property({ type: BindProperty, displayName: CC_DEV && '绑定属性', tooltip: CC_DEV && '进度受哪个属性影响' })
    private bindProp: BindProperty = new BindProperty();
    @property({ type: cc.Node, displayName: CC_DEV && '进度数字', tooltip: CC_DEV && '把显示数字的节点拖进来\n不想显示数值就置空' })
    private labelNode: cc.Node = null;
    @property({ type: cc.Enum(NumberFormat), displayName: CC_DEV && '······数字格式', tooltip: CC_DEV && '例如：180/220 或 83.32%', visible() { return this.labelNode !== null } })
    private numFormat: NumberFormat = NumberFormat.几杠几;
    @property({ min: 0, displayName: CC_DEV && '······小数位数', tooltip: CC_DEV && '数字保留小数点后几位', visible() { return this.labelNode !== null && this.numFormat === NumberFormat.百分比 } })
    private numDigit: number = 0;
    @property({ type: cc.SpriteFrame, displayName: CC_DEV && '特效图片', tooltip: CC_DEV && '用来绘制特效的图片\n一般用白图' })
    private effectSpriteFrame: cc.SpriteFrame = null;
    @property({ displayName: CC_DEV && '特效颜色' })
    private effectSpriteColor: cc.Color = new cc.Color(255, 255, 255);
    @property({ type: cc.Enum(EffectType), displayName: CC_DEV && '特效类型', tooltip: CC_DEV && '注意：\n\t缩放模式需先设置底框为父节点' })
    private type: EffectType = EffectType.残影;
    @property({ min: 0, displayName: CC_DEV && '残影持续时间', tooltip: CC_DEV && '数值越大，渐变动画持续时间越长', visible() { return this.type === EffectType.残影 } })
    private shadowTime: number = 0.5;
    @property({ min: 0, displayName: CC_DEV && '残影圆角宽度', tooltip: CC_DEV && '进度条图片的圆角宽度，确保残影完美衔接', visible() { return this.type === EffectType.残影 } })
    private shadowOffset: number = 0;
    @property({ min: 0, displayName: CC_DEV && '弹射持续时间', tooltip: CC_DEV && '弹射动画的长度渐变持续时间', visible() { return this.type === EffectType.弹射 } })
    private ejectionTime: number = 0.5;
    @property({ min: 0, displayName: CC_DEV && '高光持续时间', tooltip: CC_DEV && '弹射瞬间的高光闪烁持续时间', visible() { return this.type === EffectType.弹射 } })
    private ejectionOpacityTime: number = 0.3;
    @property({ displayName: CC_DEV && '缩放比例', tooltip: CC_DEV && '缩放动画作用于父节点\n将进度条底框设为父节点\n底框会带着进度条一起缩放', visible() { return this.type === EffectType.缩放 } })
    private scaleRatio: number = 1.2;
    @property({ min: 0, displayName: CC_DEV && '缩放持续时间', tooltip: CC_DEV && '数值越大，缩放动画持续时间越长', visible() { return this.type === EffectType.缩放 } })
    private scaleTime: number = 0.2;
    private effectNode: cc.Node = null;                //特效节点
    private bindComponent: cc.Component = null;        //绑定的属性在哪个组件上
    private nodeWidthDefault: number = 0;              //预存当前节点初始width，因为会随特效改变
    private parentScaleDefault: number = 0;            //预存父节点初始Scale，因为会随特效改变
    private numLabel: any = null;                      //进度数字
    private end: number = 0;                           //真实进度
    private max: number = 0;                           //进度上限
    private _cur: number = 0;                          //当前进度（例如：残影特效，当前进度将在一定时间内缓动到真实进度）
    get cur() { return this._cur };
    private set cur(value: number) {
        this._cur = value;
        this.node.width = value * this.nodeWidthDefault / this.max;
        this.type === EffectType.弹射 && (this.effectNode.width = this.node.width);
        if (this.numLabel) {
            switch (this.numFormat) {
                case NumberFormat.几杠几: this.numLabel.string = value + '/' + this.max; break;
                case NumberFormat.百分比: this.numLabel.string = (value * 100 / this.max).toFixed(this.numDigit) + '%'; break;
            }
        }
    }

    protected start() {
        this.node.x += this.node.width * this.node.scaleX * (0 - this.node.anchorX);
        this.node.y += this.node.height * this.node.scaleY * (0.5 - this.node.anchorY);
        this.node.anchorX = 0;
        this.node.anchorY = 0.5;
        this.nodeWidthDefault = this.node.width;
        this.parentScaleDefault = this.node.parent.scale;
        this.node.getComponent(cc.Sprite).type = cc.Sprite.Type.SLICED;
        this.effectNode = new cc.Node('Effect');
        this.effectNode.setParent(this.node);
        this.effectNode.width = this.node.width;
        this.effectNode.height = this.node.height;
        this.effectNode.anchorX = this.node.anchorX;
        this.effectNode.anchorY = this.node.anchorY;
        this.effectNode.opacity = 0;
        this.effectNode.color = this.effectSpriteColor;
        let spt = this.effectNode.addComponent(cc.Sprite);
        spt.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        spt.type = cc.Sprite.Type.SLICED;
        spt.spriteFrame = this.effectSpriteFrame;
        this.numLabel = this.labelNode?.getComponent('IconFont') || this.labelNode?.getComponent(cc.Label);
        //绑定属性，并设置属性上限值
        if (this.bindProp.propNode) {
            this.bindComponent = this.bindProp.propNode.getComponent(this.bindProp.scriptName);
            if (this.bindComponent) {
                if (this.bindProp.propMax === '') {
                    this.setData(this.bindComponent[this.bindProp.propName], this.bindComponent[this.bindProp.propName]);
                } else {
                    this.setData(this.bindComponent[this.bindProp.propMax] || parseInt(this.bindProp.propMax), this.bindComponent[this.bindProp.propName]);
                }
            }
        }
    }
    //将进度条绑定给node节点的scriptName脚本中名称为propName的属性
    setProp(node: cc.Node, scriptName: string, propName: string) {
        this.bindProp.propNode = node;
        this.bindProp.scriptName = scriptName;
        this.bindProp.propName = propName;
        this.bindComponent = this.bindProp.propNode.getComponent(this.bindProp.scriptName);
    }
    //重置上限值和当前进度
    setData(max: number, cur: number = 0) {
        if (max <= 0) return;
        cc.Tween.stopAllByTarget(this);
        cc.Tween.stopAllByTarget(this.effectNode);
        this.effectNode.opacity = 0;
        this.max = max;
        this.cur = this.end = cur;
    }

    protected update() {
        let prop = this.bindComponent[this.bindProp.propName];
        if (this.end === prop) return;
        this.end = prop;
        let effectNode = this.effectNode;
        effectNode.opacity = 255;
        switch (this.type) {
            case EffectType.残影:
                if (this.cur > this.end) {
                    effectNode.anchorX = 0;
                    effectNode.width = (this.cur - this.end) * this.nodeWidthDefault / this.max;
                    this.cur = this.end;
                    effectNode.x = Math.max(this.node.width - this.shadowOffset, 0);
                } else {
                    effectNode.anchorX = 1;
                    effectNode.width = (this.end - this.cur) * this.nodeWidthDefault / this.max;
                    this.cur = this.end;
                    effectNode.x = this.node.width;
                }
                cc.tween(effectNode).to(this.shadowTime, { width: 0, opacity: 0 }).start();
                break;
            case EffectType.弹射:
                cc.tween(effectNode).to(this.ejectionOpacityTime, { opacity: 0 }).start();
                cc.tween(<EffectBar>this).to(this.ejectionTime, { cur: this.end }, { easing: 'expoOut' }).start();
                break;
            case EffectType.缩放:
                this.cur = this.end;
                this.effectNode.width = this.node.width;
                this.node.parent.scale = this.parentScaleDefault * this.scaleRatio;
                cc.tween(effectNode).to(this.scaleTime, { opacity: 0 }).start();
                cc.tween(this.node.parent).to(this.scaleTime, { scale: this.parentScaleDefault }).start();
                break;
        }
    }

    protected onDestroy() {
        if (cc.isValid(this.effectNode)) {
            this.effectNode.destroy();
            this.effectNode.removeFromParent();
        };
    }
}