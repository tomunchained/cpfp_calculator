document.getElementById('txid-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const txid = document.getElementById('txid').value;
    const outputType = document.getElementById('output-type').value;
    const inputType = document.getElementById('input-type').value;
    
    // Define vsizecpfpinput based on the selected input type (adds overhead data)
    let vsizecpfpinput;
    switch(inputType) {
        case 'P2PKH':
            vsizecpfpinput = 158; // 148 + 10 vB overhead
            break;
        case 'P2SH':
            vsizecpfpinput = 307; // 297 + 10 vB overhead
            break;
        case 'P2WPKH':
            vsizecpfpinput = 78.5; // 68 + 10.5 vB overhead
            break;
        case 'P2WSH':
            vsizecpfpinput = 115; // 104.5 + 10.5 vB overhead
            break;
        case 'P2TR':
            vsizecpfpinput = 68; // 57.5 + 10.5 vB overhead
            break;
        default:
            vsizecpfpinput = 0;
    }

    // Define vsizecpfpoutput based on the selected output type
    let vsizecpfpoutput;
    switch(outputType) {
        case 'P2PKH':
            vsizecpfpoutput = 34;
            break;
        case 'P2SH':
            vsizecpfpoutput = 32;
            break;
        case 'P2WPKH':
            vsizecpfpoutput = 31;
            break;
        case 'P2WSH':
            vsizecpfpoutput = 43;
            break;
        case 'P2TR':
            vsizecpfpoutput = 43;
            break;
        default:
            vsizecpfpoutput = 0;
    }
    
    // Calculate the total vsizecpfp
    const vsizecpfp = vsizecpfpinput + vsizecpfpoutput;
    document.getElementById('cpfp-size').textContent = vsizecpfp.toFixed(2);
    
    // Fetch transaction details
    fetch(`https://mempool.space/api/tx/${txid}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const weight = data.weight;  // Parameter for weight units
            const fee = data.fee;
            const vsize = weight / 4;  // Convert weight to vB
            
            document.getElementById('size').textContent = vsize !== undefined ? vsize.toLocaleString() : 'Not Available'; // Add a fallback message and format to 1 decimal place
            document.getElementById('fee').textContent = fee !== undefined ? fee.toLocaleString() : 'Not Available';

            // Calculate and display old fee rate
            const oldfeerate = (fee / vsize).toFixed(2);
            document.getElementById('oldfeerate').textContent = oldfeerate;
            
            // Fetch recommended fees
            fetch('https://mempool.space/api/v1/fees/recommended')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(feesData => {
                    const fastestFee = feesData.fastestFee;  // Parameter for high priority fee rate
                    document.getElementById('fastest-fee').textContent = fastestFee !== undefined ? fastestFee : 'Not Available'; // Add a fallback message
                    
                    // Calculate CPFP Fee Rate
                    const cpfpFeeRate = ((fastestFee * (vsize + vsizecpfp)) - fee) / vsizecpfp;
                    document.getElementById('cpfp-fee-rate').textContent = cpfpFeeRate.toFixed(2);

                    // Calculate and display CPFP Fee
                    const cpfpfee = (cpfpFeeRate * vsizecpfp).toLocaleString();
                    document.getElementById('cpfp-fee').textContent = cpfpfee;
                })
                .catch(error => {
                    document.getElementById('fastest-fee').textContent = 'N/A';
                    document.getElementById('cpfp-fee-rate').textContent = 'N/A';
                    console.error('Error fetching fees data:', error);
                });
        })
        .catch(error => {
            document.getElementById('size').textContent = 'N/A';
            document.getElementById('fee').textContent = 'N/A';
            console.error('Error fetching transaction data:', error);
        });
});
