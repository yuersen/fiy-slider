/**
 * slider components
 * @author pxyamos
 * @description A slider component depends on Vue 2.x
 */

function toArray(arraylike) {
	return Array.prototype.slice.call(arraylike);
}
/*
@transitionend="transitionend" 
@webkitTransitionEnd="transitionend"
@mousedown="thstart" 
@mousemove="thmove" 
@mouseup="thend"
*/
Vue.component('slider-wrap', {
	template: `
		<div class="fiy-swiper-container" @touchmove="fn">
    	<div class="fiy-default-swiper-box"
				:style="{
					'transform': swiperStyle.transform, 
					'-webkit-transform': swiperStyle.transform, 
					'transition-duration': swiperStyle.transitionDuration, 
					'-webkit-transition-duration': swiperStyle.transitionDuration,
					'flex-direction': swiperStyle.direction
				}"  
				:ref="refname" 
				@touchstart="touchstart" 
				@touchmove="touchmove" 
				@touchend="toushend">
				<slot></slot>
			</div>
      <slot name="pagination">
				<!-- 默认提供了一个 pagination -->
				<div class="fiy-pagination" 
					v-if="pagination"
					:class="{'fiy-pagination-vl': !isHorizontal}">
					<div class="fiy-dot" 
						v-for="(value, key) in reallySlidesNumber" 
						:key="key"
						:class="{'fiy-dot-active': currentSlide== key}"></div>	
				</div>
			</slot>
			<!-- 这两个就不默认提供了 -->
			<slot name="arrowLeft"/>
			<slot name="arrowRight"/>

			<!-- 当你需要在全局的内容里面加一些玩意的时候 -->
			<slot name="g"/>
    </div>
	`,

	props: {
		duration: { // 一次滑动的默认时间
			default: 300
		},
		interval: { // 两次滑动的间隔时间
			default: 3000
		},
		autoplay: { // 是否自动播放
			default: false
		},
		therehold: { // 用户滑动多少距离, 翻页
			default: 60
		},
		defaultSlide: { // 默认开始，有效数字 0 ~ slider.length - 1
			default: 0
		},
		pagination: { // 展示分页
			default: true
		},
		direction: { // 滑动方向，vl -> vertical, hl -> horizontal
			default: 'hl'
		},
		loop: { // 是否循环滑动
			default: true
		},
		vLock: { // 禁用垂直方向的滚动
			default: false
		}
	},
	data() {
		return {
			swiper: null,
			swiperSize: 0, // 根据滚动方向获取容器 clientWidth or clientHeight
			slides: null,
			slidesNumber: 0,
			reallySlidesNumber: 0, // actual number of slider
			currentSlide: 0,
			isOnly: false, // only one slider and do nothing
			isHorizontal: true, // 水平滚动
			timer: null,
			userDuration: 200,
			offsetX: 0, //记录初始位移
			pos: {
				start: 0,
				move: 0,
				end: 0,
				local: 0,
				distance: 0
			},
			moving: false,
			unlock: false,
			activeId: '',
			mousedown: false,
			refname: 'swiper' + String(Math.random()).substr(2, 5),
			swiperStyle: {
				transform: '',
				transitionDuration: '',
				direction: 'row'
			}
		}
	},
	mounted() {
		var that = this;

		that.init();

		if (that.isOnly) {
			return;
		}

		if (that.loop) { // loop
			that.cloneSlide();
		}
		that.setDefaultSlide();

		if (that.autoplay) {
			that.play();
		}
	},
	methods: {
		/**
		 * initial variable
		 */
		init() {
			let that = this,
				isHorizontal = that.direction === 'hl';

			that.swiper = that.$refs[this.refname];
			that.isHorizontal = isHorizontal;
			that.swiperSize = that.swiper[isHorizontal ? 'clientWidth' : 'clientHeight'];
			that.swiperStyle.direction = isHorizontal ? 'row' : 'column';
			that.slides = toArray(that.swiper.children);

			if (!that.slides.length) {
				throw new Error('[fiy-swiper:Error]: Must contain a display content in <slider-wrap>');
				return;
			}

			that.slidesNumber = that.slides.length;
			that.reallySlidesNumber = that.slides.length;
			that.isOnly = that.reallySlidesNumber === 1;

			// 非 loop 禁止自动播放
			if (!that.loop) {
				that.autoplay = false;
			}
		},

		/**
		 * clone the first and last slide dom to Ensure continuity of sliding
		 */
		cloneSlide() {
			let that = this,
				slidesNumber = that.slidesNumber,
				$first = that.slides[0],
				$last = that.slides[slidesNumber - 1];

			that.swiper.appendChild($first.cloneNode($first, true));
			that.swiper.insertBefore($last.cloneNode($last, true), $first);
			// 克隆节点之后, 需要重置一些属性
			that.slides = toArray(that.swiper.children);
			that.slidesNumber = that.slides.length;
		},

		// 根据用户给定的 defaultSlide 设置 init slide 的值
		setDefaultSlide() {
			let that = this;

			// 用户给定的值, 都是从 0 - x 开始，loop 模式下对头(0)和尾(sliderlength - 1)两个 slider 进行拷贝，
			// 实际计算用户指定位置 + 1
			// 如果用户设置了一个非法值, 直接抛出异常
			if (that.defaultSlide < 0 || that.defaultSlide > that.slidesNumber - 1 - (that.loop ? 2 : 0)) {
				throw new Error('[fiy-swiper:Error]: You have set a wrong defaultSlide value with defaultSlide = ' + that.defaultSlide);
			}
			that.translate3d(-that.swiperSize * (that.defaultSlide + (that.loop ? 1 : 0)));
			that.currentSlide = that.defaultSlide;
		},

		/**
		 * 设置 3D 位移
		 * @param {Number} dt - x/y 轴位移
		 */
		translate3d(dt) {
			let that = this,
				dts = [dt + 'px', 0];
			dts[that.isHorizontal ? 'push' : 'unshift'](0);
			that.swiperStyle.transform = 'translate3d(' + dts.join(',') + ')';
		},

		/**
		 * start slider
		 */
		play() {
			let that = this;

			that.timer = setTimeout(() => {
				clearTimeout(that.timer);
				that.moving = true;
				that.unlock = false;
				that.transitionDuration(that.duration);
				that.translate3d(-(that.swiperSize + Math.abs(that.getBoundingClientRect())));

				setTimeout(() => {
					that.transitionend();
				}, that.duration);
			}, that.interval);
		},

		/**
		 * 设置过渡时间
		 * @param {Number} ms - 过渡时间
		 */
		transitionDuration(ms) {
			this.swiperStyle.transitionDuration = ms + 'ms';
		},

		/**
		 * 过渡动画结束回调
		 */
		transitionend() {
			var that = this,
				currentSlide = Math.round(Math.abs(that.getBoundingClientRect()) / this.swiperSize);

			/*
				防止极限操作, 用户在滑动结束之后事件还没发送出去又滑动导致计算
				结果错误, 所以等事件发出去之后再解开 
			*/
			that.moving = false;
			that.transitionDuration(0);

			if (!that.loop) {
				that.currentSlide = currentSlide;
				return;
			}
			that.currentSlide = currentSlide - 1;

			/* 如果滚动到最后一个, 那么就要瞬间跳转一下, 到外部看起来的第一个, 内部的*/
			if (currentSlide >= that.slidesNumber - 1) {
				that.translate3d(-that.swiperSize);
				that.currentSlide = 0;
			}
			if (currentSlide === 0) {
				that.translate3d(-that.swiperSize * (that.slidesNumber - 2))
				that.currentSlide = that.slidesNumber - 3;
			}

			that.$emit('transitionend', that.currentSlide);

			if (that.autoplay) {
				that.play();
			}
		},

		/**
		 * 获取某个元素相对于视窗的位置集合
		 */
		getBoundingClientRect() {
			let that = this;
			return that.swiper.getBoundingClientRect()[that.isHorizontal ? 'left' : 'top'];
		},

		fn(e) { // 阻止容器的上下滚动, 并且只有在水平方向上面滚动超过 10px 才可以阻止
			if (this.vLock || Math.abs(this.pos.start - this.pos.move) > 10) {
				e.preventDefault();
			}
		},

		/**
		 * touchstart handler
		 */
		touchstart(e) {
			let that = this;
			if (e.type === 'mousedown' || that.isOnly) {
				console.log('mousedown....');
				return;
			}

			if (!that.moving) {
				// Touch.identifier: 此 Touch 对象的唯一标识符. 
				// 一次触摸动作(我们指的是手指的触摸)在平面上移动的整个过程中, 该标识符不变. 
				// 可以根据它来判断跟踪的是否是同一次触摸过程. 只读属性.
				that.activeId = toArray(e.changedTouches)[0].identifier;
				clearTimeout(that.timer);
				that.transitionDuration(0);
				that.unlock = true;
				that.pos.start = this.getClientXY(e);

				/* 一次 touch 的 起始local 点, 是固定的 */
				this.pos.local = this.getBoundingClientRect();
			}
		},

		/**
		 * 获取 touchstart/touchmove/touchend 触点相对于可见视区(visual viewport)左边/上边沿的的X/Y坐标
		 */
		getClientXY(e) {
			let touches = e.touches;
			return touches[touches.length - 1][this.isHorizontal ? 'clientX' : 'clientY'];
		},

		/**
		 * toushmove handler
		 */
		touchmove(e) {
			let that = this;
			if (e.type === 'mousemove' || that.isOnly) {
				return;
			}

			if (!that.moving && that.unlock) {
				that.pos.move = that.getClientXY(e);
				// 滑动到 viewport 之外
				if (that.pos.move < 0 || that.pos.move > that.swiperSize) {
					that.recover();
					return;
				}
				that.pos.distance = that.pos.move - that.pos.start;

				// 非 loop 模式下，操作 first 和 last 左/右滑动禁止
				if (!that.loop && (
						(that.currentSlide === 0 && that.pos.distance > 0) ||
						(that.currentSlide === (that.reallySlidesNumber - 1) && that.pos.distance < 0)
					)) {
					return;
				}

				that.translate3d(that.pos.local + that.pos.distance);
			}
		},

		/**
		 * toushend handler
		 */
		toushend(e) {
			let that = this,
				changedTouches = e.changedTouches,
				curId;
			if (e.type === 'mouseup' || that.isOnly) {
				return;
			}

			// TouchEvent.changedTouches 只读
			// 一个 TouchList 对象，包含了代表所有从上一次触摸事件到此次事件过程中，状态发生了改变的触点的 Touch 对象。
			curId = toArray(changedTouches)[0].identifier;
			if (!that.moving && that.unlock && (curId === that.activeId)) {
				that.unlock = false;
				that.pos.end = changedTouches[0][that.isHorizontal ? 'clientX' : 'clientY'];
				that.pos.distance = that.pos.end - that.pos.start;
				that.recover();
			}
		},

		/**
		 * 响应用户滚动行为
		 */
		recover() {
			let that = this,
				bcrect = that.getBoundingClientRect(),
				distance = Math.abs(bcrect) % that.swiperSize,
				point = [],
				direction = '',
				next;

			that.transitionDuration(that.userDuration);

			// 获取当前状态下面, swiper 距离正常状态, 左右移动的距离分别是多少. 
			if (bcrect > 0) {
				point = [distance, that.swiperSize - distance];
			} else {
				point = [that.swiperSize - distance, distance];
			}

			if (that.pos.distance > 0) {
				direction = 'to-r-b'; // 向右或下滑动
			} else if (that.pos.distance < 0) {
				direction = 'to-l-t'; // 向左或上滑动
			} else {
				direction = 'none';
			}

			if (direction === 'none') {
				if (that.autoplay) {
					that.play();
				}
			} else {
				if (direction === 'to-r-b') {
					if (point[0] > that.therehold) {
						that.translate3d(bcrect + point[1]);
						next = (bcrect + point[1]) / that.swiperSize;
						if (Math.abs(next) === 0) {
							that.unlock = false;
						}
					} else {
						that.translate3d(bcrect - point[0]);
					}
				} else if (direction === 'to-l-t') {
					if (point[1] > that.therehold) {
						that.translate3d(bcrect - point[0]);
						next = (bcrect - point[0]) / that.swiperSize;
						if (Math.abs(next) === that.slidesNumber - 1) {
							that.unlock = false;
						}
					} else {
						that.translate3d(bcrect + point[1]);
					}
				}

				that.moving = true;
				setTimeout(() => {
					that.transitionend();
				}, that.duration);
			}
		},

		/**
		 * 滑动到指定的页面
		 * @param {Number} index - 指定页索引
		 */
		slideTo(index) {
			var that = this;
			if (!that.moving) {
				let currentSlide = Math.round(Math.abs(that.getBoundingClientRect()) / that.swiperSize);
				/* 如果索引值不合法 或者和目前的值相等 */
				if (index > that.slidesNumber - 1 - (that.loop ? 2 : 0) || index < 0 || currentSlide == index + 1) {
					return;
				}
				that.moving = true;
				clearTimeout(that.timer);
				/*
					说明要往右边滑动
					注意这里不管需要滑动多少个, duration 都是 300, 这个如果需要, 可以
					自己根据起点/终点计算出一个合适的值. 
				*/
				that.transitionDuration(300);
				that.translate3d(-that.swiperSize * (index + 1));
				setTimeout(() => {
					that.transitionend();
				}, that.duration);
			}
		},
		next() {
			let that = this;

			if (that.forbiddenSlideInUnLoop('next')) {
				return;
			}

			if (!that.moving) {
				clearTimeout(that.timer);
				that.moving = true;
				that.transitionDuration(that.userDuration)
				that.translate3d(that.getBoundingClientRect() - that.swiperSize);
				setTimeout(() => {
					that.transitionend();
				}, that.duration);
			}
		},
		forbiddenSlideInUnLoop(operator) {
			let that = this,
				curSlide = that.currentSlide + (operator === 'next' ? 1 : -1); // next +1, previous -1

			if (!that.loop && (curSlide > that.slidesNumber - 1 || curSlide < 0)) {
				return true;
			}
			return false;
		},
		previous() {
			let that = this;

			if (that.forbiddenSlideInUnLoop('previous')) {
				return;
			}
			
			if (!that.moving) {
				clearTimeout(that.timer);
				that.moving = true;
				that.transitionDuration(that.userDuration)
				that.translate3d(that.getBoundingClientRect() + that.swiperSize);
				setTimeout(() => {
					that.transitionend();
				}, that.duration);
			}
		}
	}
});