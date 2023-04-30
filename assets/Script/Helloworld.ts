import EffectBar from "./EffectBar";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Helloworld extends cc.Component {
    progress: number = 0;
    progressMax:number = 100;
    lv: number = 0;
    protected start() {
        this.node.getChildByName('进度+').on(cc.Node.EventType.TOUCH_START, () => {
            this.progress += 35;
            if (this.progress >= this.progressMax) {
                this.progress -= this.progressMax;
                this.progressMax += 20;
                cc.find('残影进度条/进度', this.node).getComponent(EffectBar).setData(this.progressMax);
                cc.find('弹射进度条/进度', this.node).getComponent(EffectBar).setData(this.progressMax);
                cc.find('缩放进度条/进度', this.node).getComponent(EffectBar).setData(this.progressMax, this.progress);
                this.node.getChildByName('等级').getComponent(cc.Label).string = `等级：${++this.lv}`;
            }
        }, this);
        this.node.getChildByName('进度-').on(cc.Node.EventType.TOUCH_START, () => {
            this.progress = Math.max(this.progress - 45, 0);
        }, this);
    }
}