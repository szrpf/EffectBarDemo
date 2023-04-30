/*******************************************************************************
 * 创建:    2022年8月3日
 * 作者:    水煮肉片饭（27185709@qq.com）
 * 描述:    特效进度条
 * 给进度条挂上该组件，进度变化时，进度条会播放动画特效
 * 1、绑定属性后，属性变化，进度条也跟着变化。
 * 2、上限值可以填属性名称，也可以直接填数值。
 * 3、将挂着cc.Label或IconFont组件的节点拖入，会显示进度数字。
 *    cc.Label或IconFont的默认内容会作为分隔符。例如填入“/”，则进度条数字显示为“xxx/xxx”
 * 4、setProp重新绑定属性（例如：动态脚本，需在初始化的时候主动调用setProp绑定属性）
 *    setData重置上限值和当前进度（例如：升级后经验上限提高）
*******************************************************************************/
export enum EffectType {
    残影, 弹射, 缩放
}
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
    @property({ type: cc.SpriteFrame, displayName: CC_DEV && '特效图片', tooltip: CC_DEV && '用来绘制特效的图片\n一般用白图' })
    private effectSpriteFrame: cc.SpriteFrame = null;
    @property({ displayName: CC_DEV && '特效颜色' })
    private effectSpriteColor: cc.Color = new cc.Color(255, 255, 255);
    @property({ type: cc.Enum(EffectType), displayName: CC_DEV && '特效类型', tooltip: CC_DEV && '注意：\n\t缩放模式需先设置底框为父节点' })
    private type: EffectType = EffectType.残影;
    @property({ min: 0, displayName: CC_DEV && '残影动画时长', tooltip: CC_DEV && '数值越大，渐变动画持续时间越长', visible() { return this.type == EffectType.残影 } })
    private shadowTime: number = 0.6;
    @property({ min: 0, displayName: CC_DEV && '残影圆角宽度', tooltip: CC_DEV && '进度条图片的圆角宽度，确保残影完美衔接', visible() { return this.type == EffectType.残影 } })
    private shadowOffset: number = 0;
    @property({ min: 0, displayName: CC_DEV && '弹射持续时间', tooltip: CC_DEV && '弹射动画的长度渐变持续时间', visible() { return this.type == EffectType.弹射 } })
    private ejectionTime: number = 0.5;
    @property({ min: 0, displayName: CC_DEV && '高光闪烁时长', tooltip: CC_DEV && '弹射瞬间的高光闪烁持续时间', visible() { return this.type == EffectType.弹射 } })
    private ejectionOpacityTime: number = 0.3;
    @property({ displayName: CC_DEV && '缩放系数', tooltip: CC_DEV && '也就是放大倍数\n大于1放大，小于1缩小', visible() { return this.type == EffectType.缩放 } })
    private scale: number = 1.2;
    @property({ min: 0, displayName: CC_DEV && '缩放渐变时长', tooltip: CC_DEV && '数值越大，缩放动画持续时间越长', visible() { return this.type == EffectType.缩放 } })
    private scaleTime: number = 0.2;

    private effectNode: cc.Node = null;                //特效节点
    private bindComponent: cc.Component = null;        //绑定的属性在哪个组件上
    private labelSeparator: string = '';               //进度条数字分割符，例如  230/500  里的'/'
    private nodeWidth0: number = 0;                    //预存当前节点初始width，因为会随特效改变
    private parentScale0: number = 0;                  //预存父节点初始Scale，因为会随特效改变
    private label: any = null;
    private end: number = 0;                           //真实进度
    private max: number = 0;                           //进度上限
    private _cur: number = 0;                          //当前进度（例如：残影特效，当前进度将在一定时间内缓动到真实进度）
    get cur() { return this._cur };
    private set cur(value: number) {
        this._cur = value;
        this.node.width = value * this.nodeWidth0 / this.max;
        if (this.type !== EffectType.残影) {
            this.effectNode.width = this.node.width;
        }
        if (this.label) {
            this.label.string = this.labelSeparator ? ~~value + this.labelSeparator + this.max : ~~value;
        }
    }

    protected start() {
        this.node.x += this.node.width * this.node.scaleX * (0 - this.node.anchorX);
        this.node.y += this.node.height * this.node.scaleY * (0.5 - this.node.anchorY);
        this.node.anchorX = 0;
        this.node.anchorY = 0.5;
        this.nodeWidth0 = this.node.width;
        this.parentScale0 = this.node.parent.scale;
        this.node.getComponent(cc.Sprite).type = cc.Sprite.Type.SLICED;
        this.effectNode = new cc.Node('特效');
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
        //绑定数字Label后，将其string作为分隔符
        if (this.labelNode) {
            this.label = this.labelNode.getComponent('IconFont') || this.labelNode.getComponent(cc.Label);
            this.labelSeparator = this.label && this.label.string;
        }
        //绑定属性，并设置属性上限值
        if (this.bindProp.propNode) {
            this.bindComponent = this.bindProp.propNode.getComponent(this.bindProp.scriptName);
            if(this.bindComponent){
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
        switch (this.type) {
            case EffectType.残影:
                if (this.cur > this.end) {
                    effectNode.anchorX = 0;
                    effectNode.width = (this.cur - this.end) * this.nodeWidth0 / this.max;
                    this.cur = this.end;
                    effectNode.x = Math.max(this.node.width - this.shadowOffset, 0);
                } else {
                    effectNode.anchorX = 1;
                    effectNode.width = (this.end - this.cur) * this.nodeWidth0 / this.max;
                    this.cur = this.end;
                    effectNode.x = this.node.width;
                }
                effectNode.opacity = 255;
                cc.tween(effectNode).to(this.shadowTime, { opacity: 0 }, { easing: 'cubicIn' }).start();
                cc.tween(effectNode).to(this.shadowTime, { width: 0 }).start();
                break;
            case EffectType.弹射:
                effectNode.opacity = 255;
                cc.tween(effectNode).to(this.ejectionOpacityTime, { opacity: 0 }, { easing: 'cubicIn' }).start();
                cc.tween(<EffectBar>this).to(this.ejectionTime, { cur: this.end }, { easing: 'cubicOut' }).start();
                break;
            case EffectType.缩放:
                this.cur = this.end;
                effectNode.opacity = 255;
                this.node.parent.scale = this.parentScale0 * this.scale;
                cc.tween(effectNode).to(this.scaleTime, { opacity: 0 }, { easing: 'cubicIn' }).start();
                cc.tween(this.node.parent).to(this.scaleTime, { scale: this.parentScale0 }, { easing: 'cubicOut' }).start();
                break;
        }
    }

    protected onDestroy() {
        if (cc.isValid(this.effectNode)) {
            this.effectNode.removeFromParent();
            this.effectNode.destroy();
        };
    }
}