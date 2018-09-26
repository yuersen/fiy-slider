/**
 * slider-item
 * @author pxy0809
 */
Vue.component('slider-item', {
	template: `
	<div class="fiy-slide" 
		@click="clickHandler">
		<slot/>
	</div>
	`,
	methods: {
		clickHandler () {
			this.$emit('click');
		}
	}
});