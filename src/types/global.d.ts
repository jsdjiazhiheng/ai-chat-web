import type { ComponentInternalInstance as ComponentInstance, PropType as VuePropType } from 'vue';

declare global {

  /** vue Instance */
  declare type ComponentInternalInstance = ComponentInstance;
  /**vue */
  declare type PropType<T> = VuePropType<T>;

  /**
   * 界面字段隐藏属性
   */
  declare interface FieldOption {
    key: number;
    label: string;
    visible: boolean;
    children?: Array<FieldOption>;
  }

  /**
   * 弹窗属性
   */
  declare interface DialogOption {
    /**
     * 弹窗标题
     */
    title?: string;
    /**
     * 是否显示
     */
    visible: boolean;
  }

  /**
   * 分页查询参数
   */
  declare interface PageQuery {
    pageNum: number;
    pageSize: number;
  }
}