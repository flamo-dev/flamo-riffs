import { defineNodeScript } from '/vendor/flamo-runtime/index.es.js';
// Exact names from annotation-83196c71c9844925. IDs live only in artifact roles.
const properties = [
    "ltzq1Show",
    "ltzs1Show",
    "ltzs2zShow",
    "ltzs2yShow",
    "ltzs3Show",
    "ltzs4Show",
    "ltzf1Show",
    "ltzf2Show",
    "ltzf3Show",
    "ltzf4Show",
    "ltzy1Show",
    "ltzy2Show",
    "ltzy3Show"
];
export default defineNodeScript({
    setup(props, ctx) {
        // Resolve all roles before any mutation, so a broken mapping fails atomically.
        const targets = properties.map(property => {
            const handle = ctx.role(property);
            if (!handle)
                throw new Error('Jianpan2 visibility role missing: ' + property);
            return { property, handle, previous: handle.get('NodeCpt.visible') };
        });
        for (const { property, handle, previous } of targets) {
            const apply = (value) => {
                if (typeof value === 'boolean')
                    handle.setVisible(value);
            };
            apply(props[property]);
            const stop = ctx.watch(() => props[property], apply);
            ctx.dispose(() => {
                stop();
                if (typeof previous === 'boolean')
                    handle.setVisible(previous);
            });
        }
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NyaXB0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2NyaXB0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLG1DQUFtQyxDQUFDO0FBRXJFLGlGQUFpRjtBQUNqRixNQUFNLFVBQVUsR0FBRztJQUNqQixXQUFXO0lBQ1gsV0FBVztJQUNYLFlBQVk7SUFDWixZQUFZO0lBQ1osV0FBVztJQUNYLFdBQVc7SUFDWCxXQUFXO0lBQ1gsV0FBVztJQUNYLFdBQVc7SUFDWCxXQUFXO0lBQ1gsV0FBVztJQUNYLFdBQVc7SUFDWCxXQUFXO0NBQ0gsQ0FBQztBQUdYLGVBQWUsZ0JBQWdCLENBQVE7SUFDckMsS0FBSyxDQUFDLEtBQUssRUFBRSxHQUFHO1FBQ2QsK0VBQStFO1FBQy9FLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDeEMsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsTUFBTTtnQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLG9DQUFvQyxHQUFHLFFBQVEsQ0FBQyxDQUFDO1lBQzlFLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQztRQUN2RSxDQUFDLENBQUMsQ0FBQztRQUNILEtBQUssTUFBTSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksT0FBTyxFQUFFLENBQUM7WUFDckQsTUFBTSxLQUFLLEdBQUcsQ0FBQyxLQUFjLEVBQUUsRUFBRTtnQkFDL0IsSUFBSSxPQUFPLEtBQUssS0FBSyxTQUFTO29CQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0QsQ0FBQyxDQUFDO1lBQ0YsS0FBSyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JELEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFO2dCQUNmLElBQUksRUFBRSxDQUFDO2dCQUNQLElBQUksT0FBTyxRQUFRLEtBQUssU0FBUztvQkFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2pFLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztJQUNILENBQUM7Q0FDRixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkZWZpbmVOb2RlU2NyaXB0IH0gZnJvbSAnL3ZlbmRvci9mbGFtby1ydW50aW1lL2luZGV4LmVzLmpzJztcblxuLy8gRXhhY3QgbmFtZXMgZnJvbSBhbm5vdGF0aW9uLTgzMTk2YzcxYzk4NDQ5MjUuIElEcyBsaXZlIG9ubHkgaW4gYXJ0aWZhY3Qgcm9sZXMuXG5jb25zdCBwcm9wZXJ0aWVzID0gW1xuICBcImx0enExU2hvd1wiLFxuICBcImx0enMxU2hvd1wiLFxuICBcImx0enMyelNob3dcIixcbiAgXCJsdHpzMnlTaG93XCIsXG4gIFwibHR6czNTaG93XCIsXG4gIFwibHR6czRTaG93XCIsXG4gIFwibHR6ZjFTaG93XCIsXG4gIFwibHR6ZjJTaG93XCIsXG4gIFwibHR6ZjNTaG93XCIsXG4gIFwibHR6ZjRTaG93XCIsXG4gIFwibHR6eTFTaG93XCIsXG4gIFwibHR6eTJTaG93XCIsXG4gIFwibHR6eTNTaG93XCJcbl0gYXMgY29uc3Q7XG50eXBlIFByb3BzID0geyBbSyBpbiB0eXBlb2YgcHJvcGVydGllc1tudW1iZXJdXTogYm9vbGVhbiB9O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVOb2RlU2NyaXB0PFByb3BzPih7XG4gIHNldHVwKHByb3BzLCBjdHgpIHtcbiAgICAvLyBSZXNvbHZlIGFsbCByb2xlcyBiZWZvcmUgYW55IG11dGF0aW9uLCBzbyBhIGJyb2tlbiBtYXBwaW5nIGZhaWxzIGF0b21pY2FsbHkuXG4gICAgY29uc3QgdGFyZ2V0cyA9IHByb3BlcnRpZXMubWFwKHByb3BlcnR5ID0+IHtcbiAgICAgIGNvbnN0IGhhbmRsZSA9IGN0eC5yb2xlKHByb3BlcnR5KTtcbiAgICAgIGlmICghaGFuZGxlKSB0aHJvdyBuZXcgRXJyb3IoJ0ppYW5wYW4yIHZpc2liaWxpdHkgcm9sZSBtaXNzaW5nOiAnICsgcHJvcGVydHkpO1xuICAgICAgcmV0dXJuIHsgcHJvcGVydHksIGhhbmRsZSwgcHJldmlvdXM6IGhhbmRsZS5nZXQoJ05vZGVDcHQudmlzaWJsZScpIH07XG4gICAgfSk7XG4gICAgZm9yIChjb25zdCB7IHByb3BlcnR5LCBoYW5kbGUsIHByZXZpb3VzIH0gb2YgdGFyZ2V0cykge1xuICAgICAgY29uc3QgYXBwbHkgPSAodmFsdWU6IHVua25vd24pID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nKSBoYW5kbGUuc2V0VmlzaWJsZSh2YWx1ZSk7XG4gICAgICB9O1xuICAgICAgYXBwbHkocHJvcHNbcHJvcGVydHldKTtcbiAgICAgIGNvbnN0IHN0b3AgPSBjdHgud2F0Y2goKCkgPT4gcHJvcHNbcHJvcGVydHldLCBhcHBseSk7XG4gICAgICBjdHguZGlzcG9zZSgoKSA9PiB7XG4gICAgICAgIHN0b3AoKTtcbiAgICAgICAgaWYgKHR5cGVvZiBwcmV2aW91cyA9PT0gJ2Jvb2xlYW4nKSBoYW5kbGUuc2V0VmlzaWJsZShwcmV2aW91cyk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG59KTtcbiJdfQ==