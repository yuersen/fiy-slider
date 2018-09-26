# fiy-slider

依赖 [Vue](https://cn.vuejs.org/) 的滑动组件，支持循环和非循环滑动。

## 属性

- `duration`: 一次滑动的默认时间，default: 300;
- `interval`: 两次滑动的间隔时间，default: 3000；
- `autoplay`: 是否自动播放，default: false；
- `therehold`: 用户滑动多少距离, 翻页，default: 60；
- `defaultSlide`: 默认开始，有效数字 0 ~ slider.length - 1，default: 0；
- `pagination`: 展示分页，default: true；
- `direction`: 滑动方向，vl -> vertical, hl -> horizontal，default: 'hl'；
- `loop`: 是否循环滑动，default: true；

## 方法

- `slideTo(index)`: 跳转到指定的页；
- `next()`: 跳转到下一页；
- `previous()`: 跳转到上一页；